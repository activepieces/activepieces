import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { BitlyAuth } from './lib/common/auth';

export const bitly = createPiece({
  displayName: 'Bitly',
  auth: BitlyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/bitly.png',
  authors: ['Sanket6652'],
  actions: [],
  triggers: [],
});
