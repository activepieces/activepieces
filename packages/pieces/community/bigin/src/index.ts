import { createPiece, PieceAuth } from '@activepieces/pieces-framework';

export const bigin = createPiece({
  displayName: 'Bigin',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/bigin.png',
  authors: ['Sanket6652'],
  actions: [],
  triggers: [],
});
