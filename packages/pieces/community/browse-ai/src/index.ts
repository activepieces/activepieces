import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { browseAiAuth } from './lib/common/auth';

export const browseAi = createPiece({
  displayName: 'Browse AI',
  auth: browseAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/browse-ai.png',
  authors: ['your-name'],
  actions: [
    createCustomApiCallAction({
      auth: browseAiAuth,
      baseUrl: () => 'https://api.browse.ai/v2',
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [],
});
