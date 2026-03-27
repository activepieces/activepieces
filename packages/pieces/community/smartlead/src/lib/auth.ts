import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from './common/client';

const markdownDescription = `
To obtain your API key:
1. Log in to your SmartLead account
2. Go to **Profile -> Settings → API Key **
3. Copy your API key

The API key is passed as a query parameter to all API requests.
`;

export const smartleadAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${BASE_URL}/campaigns`,
        queryParams: {
          api_key: auth,
        },
      });
      return { valid: true };
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) {
        return {
          valid: false,
          error: 'Invalid API key. Please check your Smartlead API credentials.',
        };
      }
      throw error;
    }
  },
});
