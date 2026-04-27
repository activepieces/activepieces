import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export type CourierAuth = { api_key: string };

export const courierAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Courier API key. Found in Courier > Settings > API Keys.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.courier.com/lists',
        headers: {
          Authorization: `Bearer ${auth as string}`,
          Accept: 'application/json',
        },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid API key. Please check your Courier API key.',
      };
    }
  },
});
