import { createPiece, PieceAuth } from '@activepieces/pieces-framework';

export const activecampaign = createPiece({
  displayName: 'ActiveCampaign',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/activecampaign.png',
  authors: ['kishanprmr'],
  actions: [],
  triggers: [],
});
