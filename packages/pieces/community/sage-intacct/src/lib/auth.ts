import { PieceAuth } from '@activepieces/pieces-framework';

export const sageIntacctAuth = PieceAuth.OAuth2({
  required: true,
  authUrl: 'https://api.intacct.com/ia/api/v1/oauth2/authorize',
  tokenUrl: 'https://api.intacct.com/ia/api/v1/oauth2/token',
  scope: ['offline_access'],
  description: `1. In the [Sage Developer Portal](https://developer.sage.com/console/), create a REST application (you'll need your company's Intacct Web Services License Password to complete registration) and copy the generated **Client ID** and **Client Secret** below.
2. Click **Connect**, then sign in with the Sage Intacct user you want this connection to act as.

**Note:** Sage Intacct pools OAuth tokens per user and company. Authorizing a second connection for the same Intacct user against the same company can invalidate the refresh token of an earlier connection — use a dedicated integration user if you need more than one active connection.`,
});
