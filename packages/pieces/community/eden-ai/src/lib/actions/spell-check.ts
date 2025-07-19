import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { edenAiApiCall } from '../common/client';
import {
  createStaticDropdown,
  SPELL_CHECK_STATIC_PROVIDERS,
  SPELL_CHECK_STATIC_MODELS,
  SPELL_CHECK_STATIC_LANGUAGES,
  normalizeSpellCheck,
} from '../common/providers';

export const spellCheckAction = createAction({
  name: 'spell_check',
  displayName: 'Spell Check',
  description: 'Identify and correct spelling or grammar errors using Eden AI.',
  props: {
    provider: Property.Dropdown({
      displayName: 'Provider',
      description: 'The AI provider to use.',
      required: true,
      refreshers: [],
      options: createStaticDropdown(SPELL_CHECK_STATIC_PROVIDERS),
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to check for spelling or grammar errors.',
      required: true,
    }),
    language: Property.Dropdown({
      displayName: 'Language',
      description: 'Language code.',
      required: false,
      refreshers: ['provider'],
      options: createStaticDropdown(SPELL_CHECK_STATIC_LANGUAGES),
    }),
    model: Property.Dropdown({
      displayName: 'Model',
      description: 'Model to use for spell check.',
      required: false,
      refreshers: ['provider'],
      options: createStaticDropdown(SPELL_CHECK_STATIC_MODELS),
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
        resourceUri: '/text/spell_check',
        body,
      });
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from Eden AI API.');
      }
      return normalizeSpellCheck(provider, response);
    } catch (err: any) {
      if (err.response && err.response.body && err.response.body.error) {
        throw new Error(`Eden AI API error: ${err.response.body.error}`);
      }
      throw new Error(`Failed to check spelling: ${err.message || err}`);
    }
  },
}); 