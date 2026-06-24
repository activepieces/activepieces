import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { textToSpeech } from './lib/actions/text-to-speech';
import { speechToText } from './lib/actions/speech-to-text';
import { SMALLEST_AI_BASE_URL, SMALLEST_AI_SOURCE_HEADERS } from './lib/common';

const markdownDescription = `
Follow these instructions to get your API Key:
1. Visit [app.smallest.ai/dashboard](https://app.smallest.ai/dashboard).
2. Click on **Developer** in the left sidebar.
3. Under **API Keys**, create or copy your key.
`;

export const smallestAiAuth = PieceAuth.SecretText({
  description: markdownDescription,
  displayName: 'API Key',
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${SMALLEST_AI_BASE_URL}/waves/v1/lightning-v3.1/get_voices`,
        headers: { Authorization: `Bearer ${auth}`, ...SMALLEST_AI_SOURCE_HEADERS },
      });
      if (response.status === 200) return { valid: true };
      return { valid: false, error: 'Invalid API Key.' };
    } catch {
      return { valid: false, error: 'Invalid API Key or could not connect to Smallest AI.' };
    }
  },
});

export const smallestAi = createPiece({
  displayName: 'Smallest AI',
  auth: smallestAiAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/smallest-ai.png',
  authors: ['smallest-inc'],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  description: 'Multilingual Text-to-Speech and Speech-to-Text — Lightning & Pulse models',
  actions: [textToSpeech, speechToText],
  triggers: [],
});
