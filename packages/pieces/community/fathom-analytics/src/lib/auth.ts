import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const FATHOM_API_BASE = 'https://api.usefathom.com/v1';

export const fathomAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: `
To create an API token:
1. Go to [https://app.usefathom.com/api](https://app.usefathom.com/api)
2. Click **Create new**
3. Give your token a name and set permissions (Admin, Read Only, or site-specific)
4. Click **Save changes**
5. Copy your API token — you won't be able to retrieve it again after navigating away
  `,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${FATHOM_API_BASE}/account`,
        headers: {
          Authorization: `Bearer ${auth}`,
        },
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API token. Please check your Fathom API credentials.',
      };
    }
  },
});
