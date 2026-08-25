import { PieceAuth } from '@activepieces/pieces-framework';
import { bufferClient } from './client';

export const bufferAuth = PieceAuth.SecretText({
  displayName: 'Access Token',
  description: `
**How to get your Buffer access token:**

1. Sign in to Buffer at https://buffer.com and open the [Developer Apps](https://publish.buffer.com/developers/apps) page.
2. Click **Create New App** and fill in the basic details (callback URL can be any placeholder).
3. After the app is created, copy the **Access Token** shown on the app's page.
4. Paste it below.

The token is sent as a Bearer token to the Buffer GraphQL API (https://api.buffer.com).`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await bufferClient.graphql<{ account: { id: string } }>({
        accessToken: auth,
        query: `query { account { id } }`,
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error:
          'Invalid Buffer access token. Make sure the token has the required scopes and try again.',
      };
    }
  },
});
