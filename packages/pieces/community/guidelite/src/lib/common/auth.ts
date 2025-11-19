import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { makeRequest } from './client';

export const guideliteAuth = PieceAuth.SecretText({
  displayName: 'Guidelite API Key',
  description: `
`,
  required: true,
  validate: async ({ auth }) => {
    if (auth) {
      try {
        await makeRequest(auth, HttpMethod.GET, '/assistant/list');
        return {
          valid: true,
        };
      } catch (error) {
        return {
          valid: false,
          error: 'Invalid API Key',
        };
      }
    }
    return {
      valid: false,
      error: 'Invalid API Key',
    };
  },
});
