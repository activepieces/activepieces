import { PieceAuth } from '@activepieces/pieces-framework';

export const sellsyAuth = PieceAuth.OAuth2({
  description: 'Authentication for Sellsy API',
  authUrl: 'https://login.sellsy.com/oauth2/authorization',
  tokenUrl: 'https://login.sellsy.com/oauth2/access-tokens',
  required: true,
  scope: ['contacts.write','comments.read', 'comments.write'],
  pkce: true,
});

