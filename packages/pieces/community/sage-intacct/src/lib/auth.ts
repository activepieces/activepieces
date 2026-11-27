import { PieceAuth } from '@activepieces/pieces-framework';

export const sageIntacctAuth = PieceAuth.OAuth2({
  description:
    'Connect with a Sage Intacct Web Services user. Your Sage Intacct REST client app must list this redirect URL, and the company must authorize your Web Services sender ID.',
  required: true,
  authUrl: 'https://api.intacct.com/ia/api/v1/oauth2/authorize',
  tokenUrl: 'https://api.intacct.com/ia/api/v1/oauth2/token',
  scope: [],
});
