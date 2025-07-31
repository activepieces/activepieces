import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { aircallAuth } from './lib/common/auth';

export const aircall = createPiece({
  displayName: 'Aircall',
  auth: aircallAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/aircall.png',
  authors: ['Sanket6652'],
  actions: [],
  triggers: [],
});
