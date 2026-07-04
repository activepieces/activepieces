import { PieceAuth } from '@activepieces/pieces-framework';

export const weekdoneAuth = PieceAuth.OAuth2({
  description: 'Weekdone OAuth2 Authentication',
  authUrl: 'https://weekdone.com/oauth_authorize',
  tokenUrl: 'https://weekdone.com/oauth_token',
  required: true,
  scope: [],
});
