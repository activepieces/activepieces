import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { CloseApiError, closeClient } from './common/client';

export const closeAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Close API key. In Close go to Settings → Developer → API Keys and create a key.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await closeClient.request({ auth, method: HttpMethod.GET, path: '/me/', query: { _fields: 'id' } });
      return { valid: true };
    } catch (error) {
      if (error instanceof CloseApiError && (error.status === 401 || error.status === 403)) {
        return { valid: false, error: 'Invalid credentials: Close rejected the API key. Create a new key in Settings → Developer → API Keys.' };
      }
      return { valid: false, error: error instanceof Error ? error.message : 'Could not reach Close.' };
    }
  },
});
