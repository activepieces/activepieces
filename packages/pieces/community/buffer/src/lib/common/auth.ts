import { PieceAuth } from '@activepieces/pieces-framework';
import { BufferApiError, bufferClient } from './client';
import { bufferQueries } from './queries';

export const bufferAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
**How to get your Buffer API key:**

1. Sign in to Buffer and open **Settings → API** (https://publish.buffer.com/settings/api).
2. Click **Create key**, give it a name, and copy the key. Buffer shows it only once.
3. Paste it below.

The key acts as you: it reaches every organization and channel on your Buffer account. All your keys and MCP connections share one request limit (Free plan: 150 requests per 15 minutes and 600 per day).`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await bufferClient.graphql<{ account: { id: string } }>({
        accessToken: auth,
        query: bufferQueries.ACCOUNT_ID,
        operation: 'check the API key',
      });
      return { valid: true };
    } catch (error) {
      if (error instanceof BufferApiError && (error.status === 401 || error.code === 'UNAUTHENTICATED' || error.code === 'UNAUTHORIZED')) {
        return {
          valid: false,
          error: 'Buffer rejected this API key. Create a new key in Buffer under Settings → API and paste it here.',
        };
      }
      if (error instanceof BufferApiError && (error.status === 429 || error.code === 'RATE_LIMIT_EXCEEDED')) {
        return {
          valid: false,
          error: 'Buffer rate-limited this account, so the key could not be checked. Wait a few minutes and try again.',
        };
      }
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Buffer could not check the API key.',
      };
    }
  },
});
