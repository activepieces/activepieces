import { OAuth2AuthorizationMethod, PieceAuth } from '@activepieces/pieces-framework';

export const RINGCENTRAL_API_BASE = 'https://platform.ringcentral.com';

export const ringcentralAuth = PieceAuth.OAuth2({
  description: `
1. Sign in to the [RingCentral Developer Console](https://developers.ringcentral.com/my-account.html#/applications) and create a new app (or edit an existing one).
2. Set **App Type** to "Server-side Web App" and **Auth Type / Grant Type** to "Authorization Code".
3. Under **Redirect URI**, add the redirect URI shown by Activepieces below.
4. Under **Permissions**, enable at least: **SMS**, **Team Messaging**, **Read Accounts**.
5. Copy the **Client ID** and **Client Secret** from the app's Credentials tab into the fields below.
`,
  authUrl: `${RINGCENTRAL_API_BASE}/restapi/oauth/authorize`,
  tokenUrl: `${RINGCENTRAL_API_BASE}/restapi/oauth/token`,
  authorizationMethod: OAuth2AuthorizationMethod.HEADER,
  required: true,
  scope: ['SMS', 'TeamMessaging', 'ReadAccounts'],
});
