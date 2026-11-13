import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { HunterApiError, apiKeyOf, hunterApi } from './common/client';

export const hunterAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Copy your API key from the [Hunter API page](https://hunter.io/api-keys) (Dashboard > API).',
  validate: async ({ auth }) => {
    const apiKey = apiKeyOf(auth);
    if (apiKey === '') {
      return { valid: false, error: 'Enter your Hunter API key.' };
    }
    try {
      await hunterApi.request({ apiKey, method: HttpMethod.GET, path: '/account', operation: 'validate API key' });
      return { valid: true };
    } catch (error) {
      if (error instanceof HunterApiError && error.status === 401) {
        return { valid: false, error: 'Invalid API key. Copy the full key from the Hunter API page.' };
      }
      return { valid: false, error: `Could not reach Hunter to check the key: ${error instanceof Error ? error.message : String(error)}` };
    }
  },
});
