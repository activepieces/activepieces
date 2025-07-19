import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { edenAiApiCall } from '../common/client';
import {
  createStaticDropdown,
  MODERATION_STATIC_PROVIDERS,
  MODERATION_STATIC_LANGUAGES,
  normalizeModeration,
} from '../common/providers';

export const moderateTextAction = createAction({
  name: 'moderate_text',
  displayName: 'Moderate Text',
  description: 'Detect explicit or policy-violating text using Eden AI.',
  props: {
    provider: Property.Dropdown({
      displayName: 'Provider',
      description: 'The AI provider to use.',
      required: true,
      refreshers: [],
      options: createStaticDropdown(MODERATION_STATIC_PROVIDERS),
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to moderate.',
      required: true,
    }),
    language: Property.Dropdown({
      displayName: 'Language',
      description: 'Language code.',
      required: false,
      refreshers: ['provider'],
      options: createStaticDropdown(MODERATION_STATIC_LANGUAGES),
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
        resourceUri: '/text/moderation',
        body,
      });
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from Eden AI API.');
      }
      return normalizeModeration(provider, response);
    } catch (err: any) {
      if (err.response && err.response.body && err.response.body.error) {
        throw new Error(`Eden AI API error: ${err.response.body.error}`);
      }
      throw new Error(`Failed to moderate text: ${err.message || err}`);
    }
  },
}); 