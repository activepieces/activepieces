import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { MemApiError, memClient } from './common';

export const memAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Create an API key in Mem under **Settings → API** and paste it here.',
  validate: async ({ auth }) => {
    try {
      await memClient.request<unknown>({
        apiKey: auth,
        method: HttpMethod.GET,
        path: '/collections',
        query: memClient.toQuery({ limit: 1 }),
      });
      return { valid: true };
    } catch (error) {
      if (error instanceof MemApiError && error.status === 401) {
        return { valid: false, error: 'Invalid API key. Mem rejected it with 401.' };
      }
      return {
        valid: false,
        error: `Could not verify the API key: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});
