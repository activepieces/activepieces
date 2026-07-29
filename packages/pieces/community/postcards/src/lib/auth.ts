import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const POSTCARDS_BASE_URL = 'https://api-postcards.designmodo.com';

export const postcardsAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Postcards API key (format `sk-pcds-api03-...`). Create it in Postcards under Account → Workspace Settings → API.',
  required: true,
  // Inside validate, `auth` is the raw entered value — a plain string for SecretText.
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${POSTCARDS_BASE_URL}/api/v1/usage`,
        headers: { Authorization: `Bearer ${auth}` },
      });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid Postcards API key.' };
    }
  },
});
