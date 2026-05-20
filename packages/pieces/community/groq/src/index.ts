import {
  AuthenticationType,
  HttpMethod,
  createCustomApiCallAction,
  httpClient,
} from '@activepieces/pieces-common';
import { PieceAuth, Property, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { askGroq } from './lib/actions/ask-groq';
import { transcribeAudio } from './lib/actions/transcribe-audio';
import { translateAudio } from './lib/actions/translate-audio';

const baseUrl = 'https://api.groq.com/openai/v1';

export const groqAuth = PieceAuth.CustomAuth({
  description: `**API Key** — Enter your Groq API Key.

**Base URL (optional)** — Leave blank to use the official Groq API (https://api.groq.com/openai/v1). Set this to point to any Groq-compatible proxy.`,
  required: true,
  fields: {
    apiKey: Property.ShortText({
      displayName: 'API Key',
      required: true,
    }),
    baseUrl: Property.ShortText({
      displayName: 'Base URL (optional)',
      description: 'Leave blank to use the official Groq API.',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    const url = (auth.baseUrl?.trim() || baseUrl).replace(/\/$/, '');
    try {
      await httpClient.sendRequest<{
        data: { id: string }[];
      }>({
        url: `${url}/models`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.apiKey,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API key or Base URL',
      };
    }
  },
});

export const groq = createPiece({
  displayName: 'Groq',
  description: 'Use Groq\'s fast language models and audio processing capabilities.',
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/groq.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  auth: groqAuth,
  actions: [
    askGroq,
    transcribeAudio,
    translateAudio,
    createCustomApiCallAction({
      auth: groqAuth,
      baseUrl: (auth) => (auth as any)?.baseUrl?.trim() || baseUrl,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${(auth as any).apiKey}`,
        };
      },
    }),
  ],
  authors: ['abuaboud'],
  triggers: [],
});
