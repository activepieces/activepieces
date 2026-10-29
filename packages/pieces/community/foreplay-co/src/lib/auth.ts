import { PieceAuth } from '@activepieces/pieces-framework';
import { ForeplayApiError, foreplayClient } from './common/client';

const foreplayCoAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Foreplay API key. In Foreplay open the Data API dashboard (https://app.foreplay.co/api-overview) and generate a key.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await foreplayClient.request({ auth, path: '/api/usage' });
      return { valid: true };
    } catch (error) {
      if (error instanceof ForeplayApiError && (error.status === 401 || error.status === 403)) {
        return { valid: false, error: 'Invalid credentials: Foreplay rejected the API key. Generate a new key at https://app.foreplay.co/api-overview.' };
      }
      return { valid: false, error: error instanceof Error ? error.message : 'Could not reach Foreplay.' };
    }
  },
});

export { foreplayCoAuth };
