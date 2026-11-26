import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { edenAiApiCall } from '../common/client';
import { createStaticDropdown } from '../common/providers';
import * as z from 'zod/mini'
import { edenAiAuth } from '../..';

const LANGUAGE_DETECTION_PROVIDERS = [
  { label: 'Amazon', value: 'amazon' },
  { label: 'Google', value: 'google' },
  { label: 'Microsoft', value: 'microsoft' },
  { label: 'ModernMT', value: 'modernmt' },
  { label: 'OpenAI', value: 'openai' },
  { label: 'xAI', value: 'xai' },
  { label: 'OneAI', value: 'oneai' },
];

function normalizeLanguageDetectionResponse(provider: string, response: any) {
  const providerResult = response[provider];
  if (!providerResult) {
    return { provider, languages: [], status: 'fail', raw: response };
  }

  const languages = (providerResult.items || []).map((item: any) => ({
    language: item.language || '',
    display_name: item.display_name || '',
    confidence: item.confidence || 0,
  }));

  return {
    provider,
    languages,
    status: providerResult.status || 'success',
    original_response: providerResult.original_response || null,
    raw: response,
  };
}

export const detectLanguageAction = createAction({
  auth: edenAiAuth,
  name: 'detect_language',
  classification: 'READ',
  displayName: 'Detect Language',
  description: 'Find out which language a text is written in.',
  audience: 'both',
  aiMetadata: {
    description:
      'Detect the language(s) of a text with confidence scores via Eden AI, routed to a chosen provider. Use it to identify the language of incoming text before branching, translating, or routing. Requires a provider and the text. Read-only analysis with no side effect, so it is safe to repeat.',
    idempotent: true,
  },
  propertyGroups: [
    { key: 'content', display: 'section', label: 'Content', icon: 'text', props: ['text'] },
    { key: 'ai_model', display: 'section', label: 'AI Provider', icon: 'code', props: ['provider', 'model'] },
  ],
  props: {
    provider: Property.Dropdown({
      auth: edenAiAuth,
      displayName: 'Provider',
      description: 'The AI service that runs this step.',
      required: true,
      refreshers: [],
      options: createStaticDropdown(LANGUAGE_DETECTION_PROVIDERS),
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text whose language you want to know.',
      required: true,
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
      options: createStaticDropdown(LANGUAGE_DETECTION_PROVIDERS),
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
      text: z.string().check(z.minLength(1, 'Text is required')),
      model: z.nullish(z.string()),
      fallback_providers: z.nullish(z.array(z.string()).check(z.maxLength(5))),
      show_original_response: z.nullish(z.boolean()),
    });

    const { 
      provider, 
      text, 
      model, 
      fallback_providers, 
      show_original_response 
    } = propsValue;

    const body: Record<string, any> = {
      providers: provider,
      text,
    };

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
        resourceUri: '/translation/language_detection',
        body,
      });

      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from Eden AI API.');
      }

      return normalizeLanguageDetectionResponse(provider, response);
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
      throw new Error(`Failed to detect language: ${err.message || err}`);
    }
  },
}); 