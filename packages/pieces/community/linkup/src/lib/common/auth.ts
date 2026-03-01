import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

const BASE_URL = 'https://api.linkup.so';

export const linkupAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
To get your API Key:

1. Go to your Linkup account dashboard
2. Navigate to API settings
3. Copy your API key
4. Paste it here
`,
  required: true,
  validate: async ({ auth }) => {
    if (!auth) {
      return {
        valid: false,
        error: 'API key is required',
      };
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${BASE_URL}/v1/credits/balance`,
        headers: {
          Authorization: `Bearer ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        return {
          valid: true,
        };
      }

      return {
        valid: false,
        error: 'Invalid API key',
      };
    } catch (error: any) {
      return {
        valid: false,
        error: 'Invalid API key. Please check your API key and try again.',
      };
    }
  },
});

