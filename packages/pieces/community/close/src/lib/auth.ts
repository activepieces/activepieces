import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeApiCall } from './common/client';

export const closeAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Close CRM API key for authentication.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await closeApiCall({
        accessToken: auth,
        method: HttpMethod.GET,
        resourceUri: '/me/',
      });

      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid API key.',
      };
    }
  },
});
