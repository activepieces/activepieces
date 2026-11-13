import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { heartbeatApi } from './common/client';

export const heartbeatAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `API access is included in Heartbeat's Scale plan. To create a key:
1. Log in to your Heartbeat community as an admin.
2. Open **Settings**, then **Automation**, then **API Keys**.
3. Click **Create API Key** and give it a label.
4. Copy the key and paste it here.

Actions run as the admin who created the key.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await heartbeatApi.request({
        token: auth,
        method: HttpMethod.GET,
        path: '/roles',
        operation: 'check API key',
      });
      return { valid: true };
    } catch (error) {
      const status = heartbeatApi.statusOf(error);
      if (status === 401 || status === 403) {
        return {
          valid: false,
          error: 'Invalid API key, or your Heartbeat plan does not include API access (Scale plan). Create a new key under Settings > Automation > API Keys.',
        };
      }
      return { valid: false, error: error instanceof Error ? error.message : 'Could not reach Heartbeat to check the API key.' };
    }
  },
});
