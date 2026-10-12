import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { robollyAiActions } from './lib/actions/ai';
import { generateImageAction } from './lib/actions/generate-image';
import { robollyAuth } from './lib/auth';
import { robollyClient } from './lib/common/client';

export const robolly = createPiece({
  displayName: 'Robolly',
  description: 'Robolly is the all‑in‑one service for personalized image, video & PDF generation with API',

  auth: robollyAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/robolly.png',
  categories: [PieceCategory.MARKETING],
  authors: ['pfernandez98', 'kishanprmr', 'MoShizzle', 'abuaboud'],
  actions: [
    generateImageAction,
    ...robollyAiActions,
    createCustomApiCallAction({
      baseUrl: () => robollyClient.baseUrl(),
      auth: robollyAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [],
});
