import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { LoopsApiError, loopsClient, LOOPS_BASE_URL } from './common/client';

export const loopsAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Your Loops API key. Generate one at [Settings → API](https://app.loops.so/settings?page=api) in your Loops dashboard.',
  required: true,
  validate: async ({ auth }) => {
    try {
      const body = await loopsClient.request<unknown>({
        apiKey: auth,
        method: HttpMethod.GET,
        path: '/api-key',
      });
      if (loopsClient.isRecord(body) && body['success'] === true) {
        return { valid: true };
      }
      return {
        valid: false,
        error: `Loops did not confirm the API key: ${JSON.stringify(body)}`,
      };
    } catch (e) {
      if (e instanceof LoopsApiError) {
        if (e.status === 401) {
          return { valid: false, error: 'Invalid API key. Please check your Loops API key.' };
        }
        return { valid: false, error: e.message };
      }
      return {
        valid: false,
        error: `Could not reach Loops: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  },
});

export { LOOPS_BASE_URL };
