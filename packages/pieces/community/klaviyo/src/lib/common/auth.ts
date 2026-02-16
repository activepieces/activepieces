import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const klaviyoAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Enter your Klaviyo Private API Key',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://a.klaviyo.com/api/accounts',
        headers: {
          'Authorization': `Klaviyo-API-Key ${auth}`,
          'revision': '2025-01-15',
          'Accept': 'application/vnd.api+json',
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API key. Please check your Klaviyo Private API Key.',
      };
    }
  },
});

export type KlaviyoAuthType = string;
