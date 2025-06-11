import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { BASE_URL } from '.';

export const skyvernAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `You can obtain your API key by navigating to [Settings](https://app.skyvern.com/settings).`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: BASE_URL + '/workflows',
        headers: {
          'x-api-key': auth as string,
        },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid API Key.',
      };
    }
  },
});
