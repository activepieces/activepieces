import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { DIXA_API_BASE_URL } from './common/client';

export const dixaAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
To obtain your API key:
1. Log into your Dixa account
2. Go to Settings → Integrations → API
3. Create or copy your API key
4. Paste it here
`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${DIXA_API_BASE_URL}/agents`,
        headers: {
          Authorization: auth,
        },
        queryParams: {
          page: '1',
        },
      });
      return {
        valid: true,
      };
    } catch {
      return {
        valid: false,
        error: 'Invalid API Key.',
      };
    }
  },
});
