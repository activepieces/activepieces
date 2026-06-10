import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const LOOPS_BASE_URL = 'https://app.loops.so/api/v1';

export const loopsAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Your Loops API key. Generate one at [Settings → API](https://app.loops.so/settings?page=api) in your Loops dashboard.',
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest<{ success: boolean }>({
        method: HttpMethod.GET,
        url: `${LOOPS_BASE_URL}/api-key`,
        headers: {
          Authorization: `Bearer ${auth}`,
          Accept: 'application/json',
        },
      });

      if (!response.body.success) {
        return { valid: false, error: 'API key validation failed.' };
      }

      return { valid: true };
    } catch (e: unknown) {
      const err = e as { response?: { status?: number } };
      if (err?.response?.status === 401) {
        return { valid: false, error: 'Invalid API key. Please check your Loops API key.' };
      }
      return { valid: false, error: 'Could not reach Loops API. Check your network.' };
    }
  },
});
