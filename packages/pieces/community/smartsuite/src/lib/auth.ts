import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { SMARTSUITE_API_URL, API_ENDPOINTS } from './common/constants';

export const smartsuiteAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your SmartSuite API key',
  required: true,
  validate: async ({ auth }) => {
    if (!auth) {
      return {
        valid: false,
        error: 'API Key is required',
      };
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${SMARTSUITE_API_URL}${API_ENDPOINTS.LIST_SOLUTIONS}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      });

      if (response.status === 200) {
        return {
          valid: true,
        };
      }

      return {
        valid: false,
        error: `Invalid API Key: ${response.status} ${response.body?.message || 'Unknown error'}`,
      };
    } catch (error) {
      return {
        valid: false,
        error: (error as Error)?.message || 'Invalid API Key',
      };
    }
  },
});
