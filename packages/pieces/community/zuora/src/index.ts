import { createPiece, PieceAuth } from '@activepieces/pieces-framework';

export const zuora = createPiece({
  displayName: 'Zuora',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/zuora.png',
  authors: [],
  actions: [],
  triggers: [],
});
