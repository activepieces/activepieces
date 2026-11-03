import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { LeexiApiError, leexiApi } from './client';

export const leexiAuth = PieceAuth.BasicAuth({
  required: true,
  description: `You can obtain Key ID and secret from [API Keys Settings](https://app.leexi.ai/en/settings/api_keys).`,
  username: {
    displayName: 'Key ID',
  },
  password: {
    displayName: 'Key Secret',
  },
  validate: async ({ auth }) => {
    try {
      await leexiApi.request({
        auth,
        method: HttpMethod.GET,
        path: ['users'],
        query: { items: 1 },
      });
      return { valid: true };
    } catch (error) {
      if (error instanceof LeexiApiError) {
        if (error.status === 401) {
          return { valid: false, error: 'Invalid Key ID or Key Secret.' };
        }
        if (error.status === 403) {
          return {
            valid: false,
            error: 'The API key is valid but lacks permission to list users. Check the key scopes in Leexi API Keys Settings.',
          };
        }
        return { valid: false, error: error.message };
      }
      return {
        valid: false,
        error: `Could not reach Leexi: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});
