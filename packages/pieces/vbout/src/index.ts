import { createPiece, PieceAuth } from '@activepieces/pieces-framework';

export const vbout = createPiece({
  displayName: 'Vbout',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/vbout.png',
  authors: ['kishanprmr'],
  actions: [],
  triggers: [],
});
