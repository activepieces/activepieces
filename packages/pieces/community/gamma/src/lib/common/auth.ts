import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const gammaAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Get your API Key from your Gamma account settings.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://public-api.gamma.app/v0.2/generations?limit=1',
        headers: {
          'X-API-KEY': auth,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key. Please check the key and try again.',
      };
    }
  },
});
