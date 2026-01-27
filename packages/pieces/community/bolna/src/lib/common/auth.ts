import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { makeRequest } from './client';

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
    if (auth) {
      try {
        await makeRequest(auth, HttpMethod.GET, '/agent/all');
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
