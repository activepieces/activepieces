import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const frillAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your Frill API key:
1. Log in to your Frill dashboard at https://app.frill.co
2. Go to **Settings > API**
3. Click **Create API Key**
4. Copy the key and paste it here

The key is used in the Authorization header as a Bearer token.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.frill.co/v1/ideas',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
        queryParams: { limit: 1 },
      });
      return { valid: true };
    } catch (e) {
      return { valid: false, error: 'Invalid API Key or unable to connect to Frill.' };
    }
  },
});
