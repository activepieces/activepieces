import { PieceAuth, createPiece } from '@activepieces/pieces-framework';

export const aircallAuth = PieceAuth.OAuth2({
  description: 'Authenticate with your Aircall account',
  authUrl: 'https://dashboard.aircall.io/oauth/authorize',
  tokenUrl: 'https://api.aircall.io/v1/oauth/token',
  required: true,
  scope: ['public_api'],
});