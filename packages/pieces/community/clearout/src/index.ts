import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { instantVerifyAction } from './lib/actions/instant-verify';
import { clearoutAuth } from './lib/auth';

export const clearout = createPiece({
  displayName: 'Clearout',
  auth: clearoutAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/clearout.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['joeworkman'],
  actions: [instantVerifyAction],
  triggers: [],
});

// Clearout API Docs https://docs.clearout.io/api.html
