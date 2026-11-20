import { PieceAuth } from '@activepieces/pieces-framework';

const markdownDescription = `
To connect Kommo:
1. In Kommo, open **Settings → Integrations** and create a private integration.
2. Open its **Keys and scopes** tab and generate a long-lived token.
3. Enter your subdomain and paste the token below. The connection stops working when the token expires.

[Kommo guide to long-lived tokens](https://developers.kommo.com/docs/long-lived-token)
`;

export const kommoAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  required: true,
  props: {
    subdomain: PieceAuth.SecretText({
      displayName: 'Subdomain',
      description: "The part before .kommo.com in your account's address.",
      required: true,
    }),
    apiToken: PieceAuth.SecretText({
      displayName: 'Long-Lived Token',
      description: "Generated in your private integration's Keys and scopes tab.",
      required: true,
    }),
  },
});
