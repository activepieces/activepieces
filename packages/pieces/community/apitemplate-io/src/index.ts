import { createPiece, PieceAuth } from '@activepieces/pieces-framework';

export const apitemplateIo = createPiece({
  displayName: 'Apitemplate-io',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/apitemplate-io.png',
  authors: [],
  actions: [],
  triggers: [],
});
