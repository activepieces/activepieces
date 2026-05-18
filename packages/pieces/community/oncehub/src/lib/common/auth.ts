import { PieceAuth } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const oncehubAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Oncehub API Key',
  required: true,
  validate: async ({ auth }) => {
    try {
      console.log('auth', auth);
      await makeRequest(auth, HttpMethod.GET, '/test');

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid API credentials',
      };
    }
  },
});
