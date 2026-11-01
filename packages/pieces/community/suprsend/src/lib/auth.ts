import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

export const SUPRSEND_API_BASE_URL = 'https://hub.suprsend.com';

export const suprsendAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'In the SuprSend dashboard, go to **Developers > API Keys** and copy a key for the workspace you want to use (for example staging or production).',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${SUPRSEND_API_BASE_URL}/v1/subscriber_list/?limit=1`,
        headers: suprsendHeaders(auth),
      });
      return { valid: true };
    } catch (e: unknown) {
      const err = e as { response?: { status?: number } };
      if (err.response?.status === 401 || err.response?.status === 403) {
        return { valid: false, error: 'Invalid API key.' };
      }
      return {
        valid: false,
        error: `Connection failed: ${String(e).slice(0, 100)}`,
      };
    }
  },
});

export function suprsendHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}
