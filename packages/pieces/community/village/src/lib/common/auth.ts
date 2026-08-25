import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

export const VILLAGE_API_BASE_URL = 'https://api.village.ai';

export const villageAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description:
    'Your Village API token. Generate one from your Village settings and paste it here.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${VILLAGE_API_BASE_URL}/v2/app`,
        headers: { Authorization: `Bearer ${auth}` },
      });
      return { valid: true };
    } catch (e) {
      return { valid: false, error: 'Invalid connection details' };
    }
  },
});
