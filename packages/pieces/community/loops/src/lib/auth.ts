import { PieceAuth } from '@activepieces/pieces-framework';

export const loopsAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Your Loops API key. Generate one at [Settings → API](https://app.loops.so/settings?page=api) in your Loops dashboard.',
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await fetch('https://app.loops.so/api/v1/api-key', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${auth}`,
          Accept: 'application/json',
        },
      });

      if (response.status === 401) {
        return { valid: false, error: 'Invalid API key. Please check your Loops API key.' };
      }

      if (!response.ok) {
        return { valid: false, error: `Unexpected response: ${response.status}` };
      }

      const body = await response.json() as { success: boolean };
      if (!body.success) {
        return { valid: false, error: 'API key validation failed.' };
      }

      return { valid: true };
    } catch (err) {
      return { valid: false, error: 'Could not reach Loops API. Check your network.' };
    }
  },
});

export const LOOPS_BASE_URL = 'https://app.loops.so/api/v1';

export function loopsAuthHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}
