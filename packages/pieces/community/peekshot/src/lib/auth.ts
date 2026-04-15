import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const peekshotAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `You can obtain your API key by navigating to [API Keys](https://dashboard.peekshot.com/dashboard/api-keys) menu.`,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.peekshot.com/api/v1/projects',
        headers: {
          'x-api-key': auth,
          'Content-Type': 'application/json',
        },
      });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid API Key.' };
    }
  },
});
