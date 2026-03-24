import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

export const clayAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Your Clay API key. Find it in Clay under Settings → API.',
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.clay.com/v3/me',
        headers: {
          Authorization: `Bearer ${auth}`,
          'X-Api-Key': auth,
        },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid Clay API key.',
      };
    }
  },
});
