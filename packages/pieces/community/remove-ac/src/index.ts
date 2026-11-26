import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { removeAcAuth } from './lib/common/auth';
import { getAccountCredits } from './lib/actions/get-account-credits';
import { removeBackground } from './lib/actions/remove-background';

export const removeAc = createPiece({
  displayName: 'remove.ac',
  description: 'AI background removal API (remove.bg compatible)',
  auth: removeAcAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/remove-ac.png',
  authors: ['V-vumika'],
  actions: [
    removeBackground,
    getAccountCredits,
    createCustomApiCallAction({
      auth: removeAcAuth,
      baseUrl: () => 'https://remove.ac/v1.0',
      authMapping: async (auth) => ({
        'X-Api-Key': auth.secret_text,
      }),
    }),
  ],
  triggers: [],
});
