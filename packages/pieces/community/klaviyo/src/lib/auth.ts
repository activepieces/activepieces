import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const klaviyoAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Enter your Klaviyo Private API Key',
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://a.klaviyo.com/api/accounts/',
        headers: {
          'Authorization': `Klaviyo-API-Key ${auth}`,
          'revision': '2024-10-15',
          'Accept': 'application/json',
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
        error: error.message || 'Failed to validate API key',
      };
    }
  },
});
