import { PieceAuth } from '@activepieces/pieces-framework';

export const meisterTaskAuth = PieceAuth.OAuth2({
  description: 'Authenticate with your MeisterTask account',
  authUrl: 'https://www.mindmeister.com/oauth2/authorize',
  tokenUrl: 'https://www.mindmeister.com/oauth2/token',
  required: true,
  scope: ['userinfo.profile', 'userinfo.email', 'meistertask'],
});