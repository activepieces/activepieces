import { PieceAuth } from '@activepieces/pieces-framework';

export const raindropAuth = PieceAuth.OAuth2({
  required: true,
  authUrl: 'https://raindrop.io/oauth/authorize',
  tokenUrl: 'https://raindrop.io/oauth/access_token',
  scope: [],
  extra: {},
});
