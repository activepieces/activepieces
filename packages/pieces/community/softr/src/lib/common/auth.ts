import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './client';

export const SoftrAuth = PieceAuth.SecretText({
  displayName: 'Softr API Key',
  description: `
`,
  required: true,
  validate: async ({ auth }) => {
    if (auth) {
      try {
        await makeRequest(auth as string, HttpMethod.GET, '/databases');
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
