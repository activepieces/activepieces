import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { edenAiApiCall } from '../common/client';
import {
  createStaticDropdown,
  TEXT_TO_SPEECH_STATIC_PROVIDERS,
  TEXT_TO_SPEECH_STATIC_LANGUAGES,
  TEXT_TO_SPEECH_STATIC_VOICES,
  normalizeTextToSpeech,
} from '../common/providers';

export const textToSpeechAction = createAction({
  name: 'text_to_speech',
  displayName: 'Generate Audio From Text',
  description: 'Convert text to spoken audio using Eden AI.',
  props: {
    provider: Property.Dropdown({
      displayName: 'Provider',
      description: 'The AI provider to use.',
      required: true,
      refreshers: [],
      options: createStaticDropdown(TEXT_TO_SPEECH_STATIC_PROVIDERS),
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to convert to speech.',
      required: true,
    }),
    language: Property.Dropdown({
      displayName: 'Language',
      description: 'The language code for the speech.',
      required: false,
      refreshers: ['provider'],
      options: createStaticDropdown(TEXT_TO_SPEECH_STATIC_LANGUAGES),
    }),
    voice: Property.Dropdown({
      displayName: 'Voice Option',
      description: 'Voice option (optional, e.g., male, female, specific voice name).',
      required: false,
      refreshers: ['provider', 'language'],
      options: createStaticDropdown(TEXT_TO_SPEECH_STATIC_VOICES),
    }),
    fallback_providers: Property.Array({
      displayName: 'Fallback Providers',
      description: 'List of fallback providers to use if the main provider fails.',
      required: false,
      defaultValue: [],
    }),
  },
  async run({ auth, propsValue }) {
    const { provider, text, language, voice, fallback_providers } = propsValue;
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
    if (voice) body['option_voice'] = voice;
    try {
      const response = await edenAiApiCall({
        apiKey: auth as string,
        method: HttpMethod.POST,
        resourceUri: '/audio/text_to_speech',
        body,
      });
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from Eden AI API.');
      }
      return normalizeTextToSpeech(provider, response);
    } catch (err: any) {
      if (err.response && err.response.body && err.response.body.error) {
        throw new Error(`Eden AI API error: ${err.response.body.error}`);
      }
      throw new Error(`Failed to generate audio: ${err.message || err}`);
    }
  },
}); 