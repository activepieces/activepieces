import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ApolloApiError, apiKeyOf, apolloApi, isScopeDenied, vendorMessage } from './common/client';

export const apolloAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
To create your Apollo API key:

1. Go to **Settings** > **[Integrations](https://app.apollo.io/#/settings/integrations)** in Apollo
2. Click **Connect** beside Apollo API
3. Click **API Keys** > **Create new key**
4. Enter a name and description, then toggle **Set as master key** (recommended)
5. Click **Create API key** and copy it to a secure location

**Use a master key.** A scoped key only reaches the endpoints selected for it, so every action your flows use must be in its scope, and Custom API Call needs a master key. Some actions (contact, account, sequence and deal search, user lists and the triggers) also need a paid Apollo plan.

[Learn more about creating API keys](https://docs.apollo.io/docs/create-api-key)
  `,
  required: true,
  validate: async ({ auth }) => {
    const apiKey = apiKeyOf(auth);
    if (apiKey === '') {
      return { valid: false, error: 'Enter your Apollo API key.' };
    }
    try {
      await apolloApi.request({ apiKey, method: HttpMethod.GET, path: '/users/api_profile', operation: 'validate API key' });
      return { valid: true };
    } catch (error) {
      if (isScopeDenied(error)) {
        return { valid: true };
      }
      if (error instanceof ApolloApiError && error.status === 401) {
        return { valid: false, error: 'Invalid Apollo API key. Copy the full key from Settings > Integrations > API Keys in Apollo.' };
      }
      if (error instanceof ApolloApiError && error.status === 403) {
        return { valid: false, error: `Apollo refused this API key: ${vendorMessage(error.responseBody)}` };
      }
      if (error instanceof ApolloApiError) {
        return { valid: false, error: `Apollo could not check the key right now (${error.status}): ${vendorMessage(error.responseBody)}. Try again in a moment.` };
      }
      return { valid: false, error: `Could not reach Apollo to check the key: ${error instanceof Error ? error.message : String(error)}` };
    }
  },
});
