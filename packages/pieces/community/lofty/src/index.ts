import { createPiece, PieceAuth } from '@activepieces/pieces-framework';

export const lofty = createPiece({
  displayName: 'Lofty',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/lofty.png',
  authors: [],
  actions: [],
  triggers: [],
});
