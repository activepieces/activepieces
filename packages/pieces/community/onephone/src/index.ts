import { createPiece, PieceAuth } from '@activepieces/pieces-framework';

export const onephone = createPiece({
  displayName: 'Onephone',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/onephone.png',
  authors: ['Sanket6652'],
  actions: [],
  triggers: [],
});
