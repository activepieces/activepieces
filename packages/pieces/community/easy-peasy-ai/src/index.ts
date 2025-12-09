import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { easyPeasyAiAuth } from './lib/common/auth';
import { customGeneratorText } from './lib/actions/custom-generator-text';
import { getAiTranscription } from './lib/actions/get-ai-transcription';
import { generateAiImage } from './lib/actions/generate-ai-image';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const easyPeasyAi = createPiece({
  displayName: 'Easy-Peasy.AI',
  auth: easyPeasyAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/easy-peasy-ai.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['sanket-a11y'],
  actions: [
    customGeneratorText,
    generateAiImage,
    getAiTranscription,
    createCustomApiCallAction({
      auth: easyPeasyAiAuth,
      baseUrl: () => `https://easy-peasy.ai`,
      authMapping: async (auth) => ({
        'Content-Type': 'application/json',
        'x-api-key': `${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
