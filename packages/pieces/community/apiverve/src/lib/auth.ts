import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { APIVERVE_BASE_URL } from './common';

export const apiverveAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API key:
1. Sign in at [dashboard.apiverve.com](https://dashboard.apiverve.com), or create a free account.
2. Open the **API Key** page.
3. Copy the key and paste it here.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${APIVERVE_BASE_URL}/v1/analytics/account`,
        headers: { 'x-api-key': auth },
      });
      return { valid: true };
    } catch (error) {
      if (error instanceof HttpError && error.response.status === 401) {
        return {
          valid: false,
          error: 'This API key was not accepted. Copy it again from the API Key page of your APIVerve dashboard.',
        };
      }
      return {
        valid: false,
        error: 'Could not reach APIVerve to check the key. Please try again in a moment.',
      };
    }
  },
});
