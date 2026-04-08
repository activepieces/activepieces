import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { makeRequest } from './client';

export const tidelyAuth = PieceAuth.SecretText({
  displayName: 'Tidely API Key',
  description: 'Your Tidely API Key. Get it from your Tidely account settings.',
  required: true,
  validate: async (auth) => {
    try {
      await makeRequest(
        auth.auth,
        HttpMethod.GET,
        '/open-api/authentication/verifyAuth',
        {}
      );
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key',
      };
    }
  },
});
