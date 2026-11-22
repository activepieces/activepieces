import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

export const VILLAGE_API_BASE_URL = 'https://api.village.ai';

export const villageAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description:
    'Your Village API token. Generate one from your Village settings and paste it here.',
  required: true,
  validate: async ({ auth }) => {
    const token = auth.trim();
    if (token.length === 0) {
      return { valid: false, error: 'Enter your Village API token.' };
    }
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${VILLAGE_API_BASE_URL}/v2/app`,
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      return { valid: true };
    } catch (error) {
      const status = readStatus(error);
      if (status === 401 || status === 403) {
        return { valid: false, error: 'Village rejected this API token: it is invalid or was revoked.' };
      }
      return {
        valid: false,
        error: status === null
          ? 'Could not reach Village to check the token. Try again.'
          : `Village returned an error (${status}) while checking the token. Try again later.`,
      };
    }
  },
});

function readStatus(error: unknown): number | null {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return null;
  }
  const response = error.response;
  if (typeof response !== 'object' || response === null || !('status' in response)) {
    return null;
  }
  return typeof response.status === 'number' ? response.status : null;
}
