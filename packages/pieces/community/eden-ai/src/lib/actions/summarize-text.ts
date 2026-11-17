import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { edenAiApiCall } from '../common/client';
import { createStaticDropdown } from '../common/providers';
import * as z from 'zod/mini'
import { edenAiAuth } from '../..';

const SUMMARIZE_PROVIDERS = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'Microsoft', value: 'microsoft' },
  { label: 'Cohere', value: 'cohere' },
  { label: 'xAI', value: 'xai' },
  { label: 'Anthropic', value: 'anthropic' },
  { label: 'Aleph Alpha', value: 'alephalpha' },
  { label: 'Writesonic', value: 'writesonic' },
  { label: 'MeaningCloud', value: 'meaningcloud' },
  { label: 'Emvista', value: 'emvista' },
  { label: 'OneAI', value: 'oneai' },
];

const SUMMARIZE_LANGUAGES = [
  { label: 'Auto Detection', value: 'auto-detect' },
  { label: 'Bulgarian', value: 'bg' },
  { label: 'Chinese', value: 'zh' },
  { label: 'Chinese (Simplified)', value: 'zh-Hans' },
  { label: 'Czech', value: 'cs' },
  { label: 'Danish', value: 'da' },
  { label: 'Dutch', value: 'nl' },
  { label: 'English', value: 'en' },
  { label: 'Estonian', value: 'et' },
  { label: 'Finnish', value: 'fi' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Modern Greek', value: 'el' },
  { label: 'Hungarian', value: 'hu' },
  { label: 'Italian', value: 'it' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Latvian', value: 'lv' },
  { label: 'Polish', value: 'pl' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Portuguese (Brazil)', value: 'pt-BR' },
  { label: 'Portuguese (Portugal)', value: 'pt-PT' },
  { label: 'Romanian', value: 'ro' },
  { label: 'Russian', value: 'ru' },
  { label: 'Slovak', value: 'sk' },
  { label: 'Slovenian', value: 'sl' },
  { label: 'Spanish', value: 'es' },
  { label: 'Swedish', value: 'sv' },
];

function normalizeSummarizeResponse(provider: string, response: any) {
  const providerResult = response[provider];
  if (!providerResult) {
    return { provider, summary: '', status: 'fail', raw: response };
  }

  return {
    provider,
    summary: providerResult.result || '',
    status: providerResult.status || 'success',
    original_response: providerResult.original_response || null,
    raw: response,
  };
}

export const summarizeTextAction = createAction({
  name: 'summarize_text',
  classification: 'READ',
  auth: edenAiAuth,
  displayName: 'Summarize Text',
  description: 'Summarize long text in a few sentences.',
  audience: 'both',
  aiMetadata: {
    description:
      'Summarize a block of text into a configurable number of sentences via Eden AI, routed to a chosen provider. Use it to condense articles, documents, or other long-form text. Requires a provider and the text; language defaults to auto-detection. Read-only analysis that produces no persistent resource, so it is safe to repeat.',
    idempotent: true,
  },
  propertyGroups: [
    { key: 'content', display: 'section', label: 'Content', icon: 'text', props: ['text', 'output_sentences', 'language'] },
    { key: 'ai_model', display: 'section', label: 'AI Provider', icon: 'code', props: ['provider', 'model'] },
  ],
  props: {
    provider: Property.Dropdown({
      auth: edenAiAuth,
      displayName: 'Provider',
      description: 'The AI service that runs this step.',
      required: true,
      refreshers: [],
      options: createStaticDropdown(SUMMARIZE_PROVIDERS),
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to summarize.',
      required: true,
    }),
    output_sentences: Property.Number({
      displayName: 'Number of Sentences',
      description: 'How long the summary is, from 1 to 20 sentences.',
      required: false,
      defaultValue: 3,
    }),
    language: Property.Dropdown({
      auth: edenAiAuth,
      displayName: 'Language',
      description: 'Language of the text. Leave on Auto Detection if unsure.',
      required: false,
      refreshers: [],
      options: createStaticDropdown(SUMMARIZE_LANGUAGES),
      defaultValue: 'auto-detect',
    }),
    model: Property.ShortText({
      displayName: 'Model',
      description: "Leave empty to use the provider's default model.",
      placeholder: 'gpt-4o',
      required: false,
    }),
    fallback_providers: Property.MultiSelectDropdown({
      auth: edenAiAuth,
      displayName: 'Fallback Providers',
      description: 'Tried in order if the main provider fails. Up to 5.',
      required: false,
      advanced: true,
      refreshers: [],
      options: createStaticDropdown(SUMMARIZE_PROVIDERS),
    }),
    show_original_response: Property.Checkbox({
      displayName: 'Include Original Response',
      description: "Adds the provider's unprocessed response to the output.",
      required: false,
      advanced: true,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      provider: z.string().check(z.minLength(1, 'Provider is required')),
      text: z.string().check(z.minLength(1, 'Text to summarize is required')),
      output_sentences: z.nullish(z.number().check(z.minimum(1), z.maximum(20))),
      language: z.nullish(z.string()),
      model: z.nullish(z.string()),
      fallback_providers: z.nullish(z.array(z.string()).check(z.maxLength(5))),
      show_original_response: z.nullish(z.boolean()),
    });

    const { 
      provider, 
      text, 
      output_sentences, 
      language, 
      model, 
      fallback_providers,
      show_original_response 
    } = propsValue;

    const body: Record<string, any> = {
      providers: provider,
      text,
    };

    if (typeof output_sentences === 'number') body['output_sentences'] = output_sentences;
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
        apiKey: auth.secret_text,
        method: HttpMethod.POST,
        resourceUri: '/text/summarize',
        body,
      });

      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from Eden AI API.');
      }

      return normalizeSummarizeResponse(provider, response);
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
      // Fallback for object errors - properly stringify
      if (err.message && typeof err.message === 'string') {
        throw new Error(`Failed to summarize text: ${err.message}`);
      }
      throw new Error(`Failed to summarize text: ${JSON.stringify(err)}`);
    }
  },
}); 