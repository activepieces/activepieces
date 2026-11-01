import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { BolnaApiError, bolnaClient } from './client';

export const bolnaaiAuth = PieceAuth.SecretText({
  displayName: 'Bolna AI API Key',
  description: `
To get your API Key:

1. Login to the dashboard at https://platform.bolna.ai
2. Navigate to Developers tab from the left menu bar after login
3. Click the button Generate a new API Key to generate a key
4. Get your API Key
`,
  required: true,
  validate: async ({ auth }) => {
    if (!auth) {
      return { valid: false, error: 'Invalid Api Key' };
    }
    try {
      await bolnaClient.makeRequest({
        apiKey: auth,
        method: HttpMethod.GET,
        path: '/user/me',
      });
      return { valid: true };
    } catch (error) {
      if (
        error instanceof BolnaApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        return { valid: false, error: 'Invalid Api Key' };
      }
      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
