import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

const BASE_URL = 'https://api.flowparser.one/v1';

export const flowParserAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
To get your API Key:

1. Go to your FlowParser account
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
        url: `${BASE_URL}/me`,
        headers: {
          flow_api_key: auth,
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
      const statusCode = error.response?.status || error.status;
      
      if (statusCode === 401 || statusCode === 403) {
        return {
          valid: false,
          error: 'Invalid API key. Please check your API key and try again.',
        };
      }

      return {
        valid: false,
        error: 'Failed to validate API key. Please check your API key and try again.',
      };
    }
  },
});

