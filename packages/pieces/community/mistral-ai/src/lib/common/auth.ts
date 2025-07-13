import { PieceAuth } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const mistralAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Enter your API key',
  required: true,

  validate: async ({ auth }) => {
    try {
      if (!auth) {
        return {
          valid: false,
          error: 'Add Api Key',
        };
      }
      await makeRequest(auth as string, HttpMethod.GET, '/models');
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
