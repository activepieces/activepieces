import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const BASE_URL = 'https://app.editionguard.com/api/v2';

export const editionguardAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: `Your EditionGuard API token.

**How to get your API token:**
1. Log in to your [EditionGuard dashboard](https://app.editionguard.com)
2. Go to **Settings** (top-bar menu)
3. Find the **API** section and copy your **Rest API Token**`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${BASE_URL}/book`,
        headers: { Authorization: `token ${auth}` },
        queryParams: { page_size: '1' },
      });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid API token. Please check your credentials.' };
    }
  },
});
