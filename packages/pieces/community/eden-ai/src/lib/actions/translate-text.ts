import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { edenAiApiCall } from '../common/client';
import { createStaticDropdown, normalizeProviderItems } from '../common/providers';

const TRANSLATION_STATIC_PROVIDERS = [
  { label: 'Google', value: 'google' },
  { label: 'Microsoft', value: 'microsoft' },
  { label: 'Deepl', value: 'deepl' },
  { label: 'ModernMT', value: 'modernmt' },
  { label: 'OneAI', value: 'oneai' },
];

function normalizeTranslation(provider: string, response: any) {
  return normalizeProviderItems(provider, response, (item, provider) => ({
    translated_text: item.translated_text || item.text || '',
    detected_source_language: item.detected_source_language || '',
    target_language: item.target_language || '',
    provider: item.provider || provider,
    raw: item,
  }));
}

export const translateTextAction = createAction({
  name: 'translate_text',
  displayName: 'Translate Text',
  description: 'Translate text into different languages using Eden AI.',
  props: {
    provider: Property.Dropdown({
      displayName: 'Provider',
      description: 'The AI provider to use.',
      required: true,
      refreshers: [],
      options: createStaticDropdown(TRANSLATION_STATIC_PROVIDERS),
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to translate.',
      required: true,
    }),
    source_language: Property.ShortText({
      displayName: 'Source Language',
      description: 'The language code of the source text (e.g., en, fr, es).',
      required: true,
    }),
    target_language: Property.ShortText({
      displayName: 'Target Language',
      description: 'The language code to translate to (e.g., en, fr, es).',
      required: true,
    }),
    fallback_providers: Property.Array({
      displayName: 'Fallback Providers',
      description: 'List of fallback providers to use if the main provider fails.',
      required: false,
      defaultValue: [],
    }),
  },
  async run({ auth, propsValue }) {
    const { provider, text, source_language, target_language, fallback_providers } = propsValue;
    if (!provider || typeof provider !== 'string' || provider.trim().length === 0) {
      throw new Error('Provider is required and must be a non-empty string.');
    }
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Text is required and must be a non-empty string.');
    }
    if (!source_language || typeof source_language !== 'string' || source_language.trim().length === 0) {
      throw new Error('Source language is required and must be a non-empty string.');
    }
    if (!target_language || typeof target_language !== 'string' || target_language.trim().length === 0) {
      throw new Error('Target language is required and must be a non-empty string.');
    }
    if (fallback_providers && !Array.isArray(fallback_providers)) {
      throw new Error('Fallback providers must be an array of provider names.');
    }
    const body: Record<string, any> = {
      providers: provider,
      text,
      source_language,
      target_language,
      fallback_providers: fallback_providers || [],
    };
    try {
      const response = await edenAiApiCall({
        apiKey: auth as string,
        method: HttpMethod.POST,
        resourceUri: '/translation/automatic_translation',
        body,
      });
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from Eden AI API.');
      }
      return normalizeTranslation(provider, response);
    } catch (err: any) {
      if (err.response && err.response.body && err.response.body.error) {
        throw new Error(`Eden AI API error: ${err.response.body.error}`);
      }
      throw new Error(`Failed to translate text: ${err.message || err}`);
    }
  },
}); 