import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { DEEPGRAM_TIMEOUTS, DeepgramApiError, deepgramClient } from './client';

export const deepgramAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `You can obtain your API key from [Deepgram Console](https://console.deepgram.com/).`,
  validate: async ({ auth }) => {
    try {
      await deepgramClient.request({
        apiKey: auth,
        method: HttpMethod.GET,
        path: '/projects',
        timeoutMs: DEEPGRAM_TIMEOUTS.manage,
        operation: 'check the API key',
      });
      return { valid: true };
    } catch (e) {
      if (
        e instanceof DeepgramApiError &&
        (e.status === 401 || e.status === 403)
      ) {
        return { valid: false, error: 'Invalid API key.' };
      }
      const status = e instanceof DeepgramApiError ? ` (HTTP ${e.status})` : '';
      return {
        valid: false,
        error: `Could not reach Deepgram to check the API key${status}. Try again in a moment.`,
      };
    }
  },
});
