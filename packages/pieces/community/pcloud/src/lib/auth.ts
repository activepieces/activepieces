import { OAuth2PropertyValue, PieceAuth } from '@activepieces/pieces-framework';

export const pcloudAuth = PieceAuth.OAuth2({
  description: 'Authenticate with pCloud to access your cloud storage.',
  authUrl: 'https://api.pcloud.com/oauth2/authorize',
  tokenUrl: 'https://api.pcloud.com/oauth2_token',
  required: true,
  scope: ['read', 'write'],
});
