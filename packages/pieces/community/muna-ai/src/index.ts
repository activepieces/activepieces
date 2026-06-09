import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { munaAiAuth } from './lib/auth';
import { createPrediction } from './lib/actions/create-prediction';

export const munaAi = createPiece({
  displayName: 'Muna',
  description: 'Run on-device AI predictions using Muna predictors.',
  auth: munaAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/muna-ai.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['sanket-a11y'],
  actions: [
    createPrediction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.muna.ai/v1',
      auth: munaAiAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
