import { PieceAuth } from '@activepieces/pieces-framework';
import { BraveSearchApiError, braveApi } from './common/client';

const authDescription = `
1. Sign in to the Brave Search API dashboard at **https://api-dashboard.search.brave.com**.
2. Open **API Keys**, create a key for your Search plan and copy it.
3. Paste the key here.

Brave bills every request (about $5 per 1,000 requests, with $5 of free credit each month). Saving this connection runs one test search, which counts as one request.`;

export const braveSearchAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: authDescription,
  validate: async ({ auth }) => {
    try {
      await braveApi.get({
        apiKey: auth,
        path: '/web/search',
        query: { q: 'test', count: '1' },
        operation: 'connection check',
      });
      return { valid: true };
    } catch (error) {
      if (error instanceof BraveSearchApiError && (error.status === 401 || (error.status === 422 && /api key/i.test(error.message)))) {
        return { valid: false, error: 'Invalid Brave Search API key. Copy a key from https://api-dashboard.search.brave.com and try again.' };
      }
      return { valid: false, error: error instanceof Error ? error.message : 'Could not verify the Brave Search API key.' };
    }
  },
});
