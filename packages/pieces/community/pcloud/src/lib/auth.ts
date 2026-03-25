import { PieceAuth } from '@activepieces/pieces-framework';

export const pcloudAuth = PieceAuth.OAuth2({
  description:
    'Connect your pCloud account. Note: pCloud has two data centers (US and EU). The correct API endpoint is determined by your account location.',
  authUrl: 'https://my.pcloud.com/oauth2/authorize',
  tokenUrl: 'https://api.pcloud.com/oauth2_token',
  required: true,
  scope: [],
});
