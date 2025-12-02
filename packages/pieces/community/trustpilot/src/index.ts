import { createPiece, PieceAuth } from '@activepieces/pieces-framework';

export const trustpilot = createPiece({
  displayName: 'Trustpilot',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/trustpilot.png',
  authors: ['sanket-a11y'],
  actions: [],
  triggers: [],
});
