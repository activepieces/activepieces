import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

const BASE_URL = 'https://dashboard.askhandle.com/api/v1';

export const askHandleAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
To get your API Key:

1. Go to https://dashboard.askhandle.com
2. Sign in to your account
3. Navigate to API settings
4. Create or copy your API token
5. Paste it here
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
        url: `${BASE_URL}/rooms/`,
        headers: {
          Authorization: `Token ${auth}`,
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

