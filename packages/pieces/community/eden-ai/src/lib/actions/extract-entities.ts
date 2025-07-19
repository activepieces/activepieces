import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { edenAiApiCall } from '../common/client';
import {
  createStaticDropdown,
  NER_STATIC_PROVIDERS,
  NER_STATIC_LANGUAGES,
  normalizeNer,
} from '../common/providers';

export const extractEntitiesAction = createAction({
  name: 'extract_entities',
  displayName: 'Extract Named Entities in Text',
  description: 'Identify entities (names, places) in text using Eden AI.',
  props: {
    provider: Property.Dropdown({
      displayName: 'Provider',
      description: 'The AI provider to use.',
      required: true,
      refreshers: [],
      options: createStaticDropdown(NER_STATIC_PROVIDERS),
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to extract entities from.',
      required: true,
    }),
    language: Property.Dropdown({
      displayName: 'Language',
      description: 'Language code.',
      required: false,
      refreshers: ['provider'],
      options: createStaticDropdown(NER_STATIC_LANGUAGES),
    }),
    fallback_providers: Property.Array({
      displayName: 'Fallback Providers',
      description: 'List of fallback providers to use if the main provider fails.',
      required: false,
      defaultValue: [],
    }),
  },
  async run({ auth, propsValue }) {
    const { provider, text, language, fallback_providers } = propsValue;
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
      return normalizeNer(provider, response);
    } catch (err: any) {
      if (err.response && err.response.body && err.response.body.error) {
        throw new Error(`Eden AI API error: ${err.response.body.error}`);
      }
      throw new Error(`Failed to extract entities: ${err.message || err}`);
    }
  },
}); 