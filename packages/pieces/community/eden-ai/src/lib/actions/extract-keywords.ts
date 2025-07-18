import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { edenAiApiCall } from '../common/client';
import { createStaticDropdown, normalizeProviderItems } from '../common/providers';

const EXTRACT_KEYWORDS_STATIC_PROVIDERS = [
  { label: 'Amazon', value: 'amazon' },
  { label: 'Microsoft', value: 'microsoft' },
  { label: 'OpenAI', value: 'openai' },
  { label: 'Tenstorrent', value: 'tenstorrent' },
  { label: 'XAI', value: 'xai' },
];

export const extractKeywordsAction = createAction({
  name: 'extract_keywords',
  displayName: 'Extract Keywords in Text',
  description: 'Identify important terms in a text using Eden AI. Supports multiple providers, languages, and models.',
  props: {
    provider: Property.Dropdown({
      displayName: 'Provider',
      description: 'The AI provider to use.',
      required: true,
      refreshers: [],
      options: createStaticDropdown(EXTRACT_KEYWORDS_STATIC_PROVIDERS),
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to extract keywords from.',
      required: true,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'Language code (e.g., en, fr, auto-detect, zh-Hans, pt-BR, etc).',
      required: false,
      defaultValue: 'en',
    }),
    model: Property.ShortText({
      displayName: 'Model',
      description: 'Optional model name for the provider (e.g., gpt-4o, grok-2-latest, etc).',
      required: false,
    }),
    fallback_providers: Property.Array({
      displayName: 'Fallback Providers',
      description: 'List of fallback providers to use if the main provider fails.',
      required: false,
      defaultValue: [],
    }),
  },
  async run({ auth, propsValue }) {
    const { provider, text, language, model, fallback_providers } = propsValue;
    if (!provider || typeof provider !== 'string' || provider.trim().length === 0) {
      throw new Error('Provider is required and must be a non-empty string.');
    }
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Text is required and must be a non-empty string.');
    }
    if (fallback_providers && !Array.isArray(fallback_providers)) {
      throw new Error('Fallback providers must be an array of provider names.');
    }
    const body: Record<string, any> = {
      providers: provider,
      text,
      fallback_providers: fallback_providers || [],
    };
    if (language) body['language'] = language;
    if (model) body['model'] = model;
    try {
      const response = await edenAiApiCall({
        apiKey: auth as string,
        method: HttpMethod.POST,
        resourceUri: '/text/keyword_extraction',
        body,
      });
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from Eden AI API.');
      }
      return normalizeProviderItems(provider, response, (item, provider) => ({
        keyword: item.keyword || item.text || item.word,
        score: item.score || item.confidence || undefined,
        provider: item.provider || provider,
        raw: item,
      }));
    } catch (err: any) {
      if (err.response && err.response.body && err.response.body.error) {
        throw new Error(`Eden AI API error: ${err.response.body.error}`);
      }
      throw new Error(`Failed to extract keywords: ${err.message || err}`);
    }
  },
}); 