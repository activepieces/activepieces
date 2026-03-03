import { PieceAuth } from '@activepieces/pieces-framework';

export const apolloAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
To create your Apollo API key:

1. Go to **Settings** > **[Integrations](https://app.apollo.io/#/settings/integrations)** in Apollo
2. Click **Connect** beside Apollo API
3. Click **API Keys** > **Create new key**
4. Enter a name and description, then select the endpoints you need (or toggle **Set as master key** for full access)
5. Click **Create API key** and copy it to a secure location

**Note:** Some endpoints require a master API key. Keep your API keys secure and be careful with whom you share access.

[Learn more about creating API keys](https://docs.apollo.io/docs/create-api-key)
  `,
  required: true,
});
