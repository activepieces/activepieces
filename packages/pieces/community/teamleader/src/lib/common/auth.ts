import {
  PieceAuth,
  
} from '@activepieces/pieces-framework';

export const teamleaderAuth = PieceAuth.OAuth2({
  description: 'Connect your Teamleader account',
  authUrl: 'https://focus.teamleader.eu/oauth2/authorize',
  tokenUrl: 'https://focus.teamleader.eu/oauth2/access_token',
  required: true,
  scope: [],
});
