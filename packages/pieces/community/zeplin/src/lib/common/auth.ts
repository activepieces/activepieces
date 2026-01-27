import { PieceAuth } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const ziplinAuth = PieceAuth.SecretText({
  displayName: 'Zeplin Personal Access Token',
  description: 'Zeplin Personal Access Token',
  required: true,
  validate: async ({ auth }) => {
    if (!auth) {
      return {
        valid: true,
        error: 'Personal Access Token not provided',
      };
    }

    try {
      await makeRequest(auth, HttpMethod.GET, '/projects');
      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid Api Key',
      };
    }
  },
});
