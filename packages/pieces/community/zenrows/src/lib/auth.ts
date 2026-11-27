import { PieceAuth } from '@activepieces/pieces-framework';
import { ZENROWS_API_BASE_URL, zenrowsClient } from './common/client';

export const zenrowsAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `
**Get your Zenrows API key:**

1. Sign in at https://app.zenrows.com (or create a free account).
2. Open the **Builder** or **Settings** page.
3. Copy your API key and paste it here.
  `,
  validate: async ({ auth }) => {
    try {
      await zenrowsClient.callOperation({
        apiKey: auth,
        operation: { method: 'GET', server: ZENROWS_API_BASE_URL, path: '/subscriptions/self/details', key: 'header' },
        values: {},
      });
      return { valid: true };
    } catch (e) {
      return { valid: false, error: e instanceof Error ? e.message : 'Invalid API key' };
    }
  },
});
