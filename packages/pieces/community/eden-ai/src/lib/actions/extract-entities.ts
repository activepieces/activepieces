import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { edenAiApiCall } from '../common/client';
import { createStaticDropdown } from '../common/providers';
import { z } from 'zod';

const NER_PROVIDERS = [
  { label: 'Amazon', value: 'amazon' },
  { label: 'Google', value: 'google' },
  { label: 'Microsoft', value: 'microsoft' },
  { label: 'OpenAI', value: 'openai' },
  { label: 'Tenstorrent', value: 'tenstorrent' },
  { label: 'XAI Grok', value: 'xai' },
  { label: 'OneAI', value: 'oneai' },
];

const NER_LANGUAGES = [
  { label: 'Auto Detection', value: 'auto-detect' },
  { label: 'Arabic', value: 'ar' },
  { label: 'Chinese', value: 'zh' },
  { label: 'Chinese (Simplified)', value: 'zh-Hans' },
  { label: 'Chinese (Taiwan)', value: 'zh-TW' },
  { label: 'Chinese (Traditional)', value: 'zh-Hant' },
  { label: 'Czech', value: 'cs' },
  { label: 'Danish', value: 'da' },
  { label: 'Dutch', value: 'nl' },
  { label: 'English', value: 'en' },
  { label: 'Finnish', value: 'fi' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Hungarian', value: 'hu' },
  { label: 'Italian', value: 'it' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Norwegian', value: 'no' },
  { label: 'Norwegian Bokmål', value: 'nb' },
  { label: 'Polish', value: 'pl' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Portuguese (Brazil)', value: 'pt-BR' },
  { label: 'Portuguese (Portugal)', value: 'pt-PT' },
  { label: 'Russian', value: 'ru' },
  { label: 'Spanish', value: 'es' },
  { label: 'Swedish', value: 'sv' },
  { label: 'Turkish', value: 'tr' },
];

function normalizeNerResponse(provider: string, response: any) {
  const providerResult = response[provider];
  if (!providerResult) {
    return { provider, entities: [], status: 'fail', raw: response };
  }

  const entities = (providerResult.items || []).map((item: any) => ({
    entity: item.entity || '',
    category: item.category || '',
    importance: item.importance || 0,
  }));

  return {
    provider,
    entities,
    status: providerResult.status || 'success',
    original_response: providerResult.original_response || null,
    raw: response,
  };
}

export const extractEntitiesAction = createAction({
  name: 'extract_entities',
  displayName: 'Extract Named Entities in Text',
  description: 'Identify entities (names, places) in text using Eden AI. Supports multiple providers, languages, and models.',
  props: {
    provider: Property.Dropdown({
      displayName: 'Provider',
      description: 'The AI provider to use for named entity recognition.',
      required: true,
      refreshers: [],
      options: createStaticDropdown(NER_PROVIDERS),
    }),
    text: Property.LongText({
      displayName: 'Text to Analyze',
      description: 'The text to extract entities from.',
      required: true,
    }),
    language: Property.Dropdown({
      displayName: 'Text Language',
      description: 'The language of the input text. Choose "Auto Detection" if unsure.',
      required: false,
      refreshers: [],
      options: createStaticDropdown(NER_LANGUAGES),
      defaultValue: 'auto-detect',
    }),
    model: Property.ShortText({
      displayName: 'Specific Model',
      description: 'Specific model to use (e.g., gpt-4o, gemini-1.5-flash, grok-2-latest). Leave empty for default.',
      required: false,
    }),
    fallback_providers: Property.MultiSelectDropdown({
      displayName: 'Fallback Providers',
      description: 'Alternative providers to try if the main provider fails (up to 5).',
      required: false,
      refreshers: [],
      options: createStaticDropdown(NER_PROVIDERS),
    }),
    show_original_response: Property.Checkbox({
      displayName: 'Include Original Response',
      description: 'Include the raw provider response in the output for debugging.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      provider: z.string().min(1, 'Provider is required'),
      text: z.string().min(1, 'Text is required'),
      language: z.string().nullish(),
      model: z.string().nullish(),
      fallback_providers: z.array(z.string()).max(5).nullish(),
      show_original_response: z.boolean().nullish(),
    });

    const { 
      provider, 
      text, 
      language, 
      model, 
      fallback_providers, 
      show_original_response 
    } = propsValue;

    const body: Record<string, any> = {
      providers: provider,
      text,
    };

    if (language && language !== 'auto-detect') body['language'] = language;
    if (show_original_response) body['show_original_response'] = true;
    
    if (fallback_providers && fallback_providers.length > 0) {
      body['fallback_providers'] = fallback_providers.slice(0, 5);
    }

    if (model) {
      body['settings'] = { [provider]: model };
    }

    try {
      const response = await edenAiApiCall({
        apiKey: auth as string,
        method: HttpMethod.POST,
        resourceUri: '/text/named_entity_recognition',
        body,
      });

      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from Eden AI API.');
      }

      return normalizeNerResponse(provider, response);
    } catch (err: any) {
      if (err.response?.body?.error) {
        throw new Error(`Eden AI API error: ${err.response.body.error}`);
      }
      if (err.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (err.response?.status === 401) {
        throw new Error('Invalid API key. Please check your Eden AI credentials.');
      }
      if (err.response?.status === 400) {
        throw new Error('Invalid request. Please check your input text and parameters.');
      }
      throw new Error(`Failed to extract entities: ${err.message || err}`);
    }
  },
}); 