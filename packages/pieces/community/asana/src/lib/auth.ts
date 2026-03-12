import { PieceAuth } from '@activepieces/pieces-framework';

export const asanaAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://app.asana.com/-/oauth_authorize',
  tokenUrl: 'https://app.asana.com/-/oauth_token',
  required: true,
  scope: ['default'],
});
