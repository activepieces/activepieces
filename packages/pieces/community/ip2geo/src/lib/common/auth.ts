import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

const BASE_URL = 'https://api.ip2geo.dev';

export const ip2geoAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
To get your API Key:

1. Sign up at https://ip2geo.dev
2. Create a project and generate an API key
3. Copy your secret key (starts with i2g_sk)
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
        url: `${BASE_URL}/convert?ip=8.8.8.8`,
        headers: {
          'X-Api-Key': auth,
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
    } catch (error: unknown) {
      return {
        valid: false,
        error: 'Invalid API key. Please check your API key and try again.',
      };
    }
  },
});
