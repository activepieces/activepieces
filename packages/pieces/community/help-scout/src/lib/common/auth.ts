import { PieceAuth } from '@activepieces/pieces-framework';

export const helpScoutAuth = PieceAuth.OAuth2({
  description: 'Authenticate with your Help Scout account',
  authUrl: 'https://secure.helpscout.net/authentication/authorizeClientApplication',
  tokenUrl: 'https://api.helpscout.net/v2/oauth2/token',
  required: true,
  scope: ['mailbox.read', 'mailbox.write', 'customer.read', 'customer.write', 'report.read'], // adjust as needed
}); 