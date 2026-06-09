import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

export const KNOCK_API_BASE_URL = 'https://api.knock.app/v1';

export const knockAuth = PieceAuth.SecretText({
  displayName: 'Knock Secret API Key',
  description:
    'Your Knock secret API key (starts with sk_). Found under Developer > API Keys in the Knock dashboard.',
  required: true,
  validate: async ({ auth }) => {
    if (!auth) {
      return { valid: false, error: 'API key is required.' };
    }

    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${KNOCK_API_BASE_URL}/users?page_size=1`,
        headers: knockHeaders(auth),
      });

      return { valid: true };
    } catch (e: unknown) {
      const err = e as { response?: { status?: number } };
      if (err.response?.status === 401 || err.response?.status === 403) {
        return {
          valid: false,
          error: 'Invalid API key or insufficient permissions.',
        };
      }
      return {
        valid: false,
        error: `Connection failed: ${String(e).slice(0, 100)}`,
      };
    }
  },
});

export function knockHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}
