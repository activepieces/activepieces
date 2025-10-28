import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { HedyApiClient } from '../common/client';

export const hedyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Generate an API key from your Hedy dashboard under Settings → API, then paste the key here (it begins with `hedy_live_`).',
  required: true,
  validate: async ({ auth }) => {
    if (!auth || typeof auth !== 'string') {
      return {
        valid: false,
        error: 'Please provide a valid API key.',
      };
    }

    const client = new HedyApiClient(auth);
    try {
      await client.request({
        method: HttpMethod.GET,
        path: '/sessions',
        queryParams: {
          limit: 1,
        },
      });

      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error:
          error instanceof Error
            ? error.message
            : 'Invalid API key. Please verify the key in your Hedy dashboard and try again.',
      };
    }
  },
});
