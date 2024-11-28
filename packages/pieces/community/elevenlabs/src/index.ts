import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { textToSpeech } from './lib/actions/text-to-speech-action';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { ElevenLabsClient } from 'elevenlabs';
import { PieceCategory } from '@activepieces/shared';

const markdownDescription = `
Follow these instructions to get your API Key:
1. Visit your Elevenlabs dashboard.
2. Once there, click on your account in the bottom left corner.
3. Press Profile + API Key.
4. Copy the API Key.
`;

export const elevenlabsAuth = PieceAuth.SecretText({
  description: markdownDescription,
  displayName: 'API Key',
  required: true,
  validate: async ({ auth }) => {
    try {
      const elevenlabs = new ElevenLabsClient({
        apiKey: `${auth}`,
      });
      await elevenlabs.user.get();
      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid API Key.',
      };
    }
  },
});

export const elevenlabs = createPiece({
  displayName: 'ElevenLabs',
  auth: elevenlabsAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/elevenlabs.png',
  authors: ['pfernandez98'],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  description: 'AI Voice Generator & Text to Speech',
  actions: [
    textToSpeech,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.elevenlabs.io',
      auth: elevenlabsAuth,
      authMapping: async (auth) => ({
        'xi-api-key': `${auth}`,
      }),
    }),
  ],
  triggers: [],
});
