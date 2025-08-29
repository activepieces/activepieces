import { PieceAuth } from '@activepieces/pieces-framework';

export const mailchimpAuth = PieceAuth.OAuth2({
  description: 'Connect your Mailchimp account',
  authUrl: 'https://login.mailchimp.com/oauth2/authorize',
  tokenUrl: 'https://login.mailchimp.com/oauth2/token',
  required: true,
  scope: [],
});
