import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

export const shippoAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: 'Your Shippo API token',
  required: true,
  validate: async ({ auth }) => {
    if (auth) {
      try {
        await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: 'https://api.goshippo.com/orders/',
          headers: {
            Authorization: `ShippoToken ${auth}`,
          },
        });
        return {
          valid: true,
        };
      } catch (error) {
        return {
          valid: false,
          error: 'Invalid Api Key',
        };
      }
    }
    return {
      valid: false,
      error: 'Invalid Api Key',
    };
  },
});
