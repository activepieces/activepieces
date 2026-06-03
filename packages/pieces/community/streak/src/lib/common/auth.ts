import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { streakApiCall } from './client';

export const streakAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `Your personal Streak API key.

**How to get your API key:**
1. Open Gmail with the Streak Chrome extension installed.
2. Click the Streak icon in the right sidebar.
3. Click the **Settings** (gear) button, then go to **Integrations**.
4. In the **Streak API** section, click **Create New Key** and copy the key.

Your API key gives full access to your Streak account — keep it secret.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await streakApiCall({
        apiKey: auth as unknown as string,
        method: HttpMethod.GET,
        path: '/api/v1/users/me',
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error:
          'Invalid Streak API Key. Make sure the key is active in Streak under Integrations.',
      };
    }
  },
});
