import { PieceAuth, Property } from "@activepieces/pieces-framework";

const authDesc = `
To connect your Chatwoot account:

**Chatwoot URL:**
- For Chatwoot Cloud, use: \`https://app.chatwoot.com\`
- For self-hosted instances, use your server URL (e.g. \`https://chatwoot.yourcompany.com\`)

**API Access Token:**
1. Log in to your Chatwoot dashboard.
2. Click your avatar in the bottom-left corner and go to **Profile Settings**.
3. Scroll down to the **Access Token** section.
4. Copy your access token.

**Account ID:**
1. In your Chatwoot dashboard, the Account ID is visible in the URL: \`/app/accounts/{ACCOUNT_ID}/...\`
2. It is a numeric value (e.g. 1, 2, etc.)

`;

export const chatwootAuth = PieceAuth.CustomAuth({
  displayName: 'Chatwoot Connection',
  required: true,
  description: authDesc,
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Chatwoot URL',
      description:
        'Your Chatwoot instance URL (e.g. https://app.chatwoot.com)',
      required: true,
      defaultValue: 'https://app.chatwoot.com',
    }),
    apiAccessToken: PieceAuth.SecretText({
      displayName: 'API Access Token',
      description: 'Your user API access token from Profile Settings',
      required: true,
    }),
    accountId: Property.Number({
      displayName: 'Account ID',
      description:
        'Your numeric account ID (visible in the dashboard URL)',
      required: true,
    }),
  },
});