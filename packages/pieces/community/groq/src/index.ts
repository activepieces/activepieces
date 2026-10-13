import {
  AuthenticationType,
  HttpMethod,
  createCustomApiCallAction,
  httpClient,
} from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { askGroq } from './lib/actions/ask-groq';
import { transcribeAudio } from './lib/actions/transcribe-audio';
import { translateAudio } from './lib/actions/translate-audio';

const baseUrl = 'https://api.groq.com/openai/v1';

export const groqAuth = PieceAuth.SecretText({
  description: `To get your API key:
1. Open [console.groq.com/keys](https://console.groq.com/keys).
2. Click **Create API Key**, name it, and copy it.`,
  displayName: 'API Key',
  required: true,
  validate: async (auth) => {
    try {
      await httpClient.sendRequest<{
        data: { id: string }[];
      }>({
        url: `${baseUrl}/models`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.auth,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API key',
      };
    }
  },
});

export const groq = createPiece({
  displayName: 'Groq',
  description: 'Use Groq\'s fast language models and audio processing capabilities.',
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/groq.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  auth: groqAuth,
  actions: [
    askGroq,
    transcribeAudio,
    translateAudio,
    createCustomApiCallAction({
      auth: groqAuth,
      baseUrl: () => baseUrl,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth.secret_text}`,
        };
      },
    }),
  ],
  authors: ['abuaboud'],
  triggers: [],
});
