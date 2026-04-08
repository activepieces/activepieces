import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { CARBONE_API_URL, CARBONE_VERSION } from './common/constants';

export const carboneAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `
To get your Carbone API key:
1. Log in to your [Carbone account](https://account.carbone.io/)
2. Navigate to **API keys** in your account settings.
3. Create or copy your API key.
`,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest<{ success: boolean; error?: string }>({
        method: HttpMethod.GET,
        url: `${CARBONE_API_URL}/templates?limit=1`,
        headers: {
          Authorization: `Bearer ${auth}`,
          'carbone-version': CARBONE_VERSION,
        },
      });

      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid API key' };
    }
  },
});