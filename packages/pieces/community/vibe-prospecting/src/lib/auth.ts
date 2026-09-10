import { PieceAuth } from '@activepieces/pieces-framework';

export const vibeProspectingAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
Generate an Explorium API key:

1. Sign up or sign in at https://www.explorium.ai/sign-up/
2. Open the admin console at https://admin.explorium.ai
3. Create an API key and paste it here

The key is sent as the \`api_key\` request header.

[Getting your API key](https://developers.explorium.ai/reference/setup/getting_your_api_key)
  `,
  required: true,
});
