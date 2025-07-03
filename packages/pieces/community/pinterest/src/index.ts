import { createPiece, PieceAuth } from '@activepieces/pieces-framework';

export const pinterest = createPiece({
  displayName: 'Pinterest',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/pinterest.png',
  authors: [],
  actions: [],
  triggers: [],
});
