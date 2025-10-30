import { PieceAuth } from '@activepieces/pieces-framework';

export const meisterTaskAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://www.mindmeister.com/oauth2/authorize',
  tokenUrl: 'https://www.mindmeister.com/oauth2/token',
  scope: [],
  required: true,
});
