import { PieceAuth } from '@activepieces/pieces-framework';
import { LemonSqueezyApiError, RATE_LIMIT_WAITS, lsRequest } from './client';

export const lemonSqueezyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
To get your API Key:

1. Go to your Lemon Squeezy dashboard
2. Navigate to Settings » API
3. Create a new API key
4. Copy the API key and paste it here

Keys created in test mode only see test-mode data, and webhooks for this connection are created in the same mode.
`,
  required: true,
  validate: async ({ auth }) => {
    if (!auth || !auth.trim()) {
      return { valid: false, error: 'API key is required' };
    }
    try {
      await lsRequest({ apiKey: auth, method: 'GET', path: '/users/me', rateLimitWaitsMs: RATE_LIMIT_WAITS.interactive });
      return { valid: true };
    } catch (error) {
      if (error instanceof LemonSqueezyApiError && (error.status === 401 || error.status === 403)) {
        return { valid: false, error: 'Invalid API key. Please check your API key and try again.' };
      }
      return {
        valid: false,
        error: `Could not reach Lemon Squeezy to check the key: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});
