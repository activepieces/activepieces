import { createPiece, PieceAuth } from '@activepieces/pieces-framework';

export const smsApi = createPiece({
  displayName: 'SMSAPI',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/sms-api.png',
  authors: [],
  actions: [],
  triggers: [],
});
