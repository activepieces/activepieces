import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

const authDes = `
To obtain your Cohere API Key:

1. Go to the [Cohere Dashboard](https://dashboard.cohere.com/api-keys).
2. Sign in or create a free account.
3. Navigate to **API Keys** in the left sidebar.
4. Click **Create Trial Key** (free) or use a production key.
5. Copy the key and paste it below.

`;

export const cohereAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: authDes,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        url: 'https://api.cohere.com/v2/models',
        method: HttpMethod.GET,
        headers: {
          Authorization: `Bearer ${auth}`,
        },
      });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid API Key' };
    }
  },
});
