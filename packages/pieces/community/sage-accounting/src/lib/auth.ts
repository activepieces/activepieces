import { PieceAuth } from '@activepieces/pieces-framework';

export const sageAccountingAuth = PieceAuth.OAuth2({
  required: true,
  authUrl: 'https://www.sageone.com/oauth2/auth/central?filter=apiv3.1',
  tokenUrl: 'https://oauth.accounting.sage.com/token',
  scope: ['full_access'],
  description: `1. In the [Sage Developer Portal](https://developer.sage.com/console/), create an app for the Sage Accounting API and copy the generated **Client ID** and **Client Secret** below.
2. Click **Connect**, then sign in with the Sage Accounting user you want this connection to act as, and select the business to connect.

**Note:** All requests act on the user's lead business. If the connected user has access to more than one business, use a dedicated integration user scoped to the business you want to automate.`,
});
