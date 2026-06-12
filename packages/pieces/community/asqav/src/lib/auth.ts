import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asqavApiCall } from './common';

export const asqavAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your Asqav API key:
1. Sign in at [asqav.com](https://asqav.com).
2. Open **Dashboard → API Keys**.
3. Create a key and copy it (it starts with \`sk_\`).`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await asqavApiCall({
        apiKey: auth,
        method: HttpMethod.GET,
        resourceUri: '/agents',
        queryParams: { limit: '1' },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error:
          'Invalid API key. Copy a current key from your Asqav dashboard under API Keys.',
      };
    }
  },
});