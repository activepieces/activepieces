import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { CarboneApiError, carboneClient } from './common/client';

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
      await carboneClient.request({
        apiKey: auth,
        method: HttpMethod.GET,
        path: '/templates',
        operation: 'validate connection',
        queryParams: { limit: '1' },
      });
      return { valid: true };
    } catch (error) {
      if (error instanceof CarboneApiError && (error.httpStatus === 401 || error.httpStatus === 403)) {
        return { valid: false, error: 'Invalid API key' };
      }
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Could not reach Carbone',
      };
    }
  },
});
