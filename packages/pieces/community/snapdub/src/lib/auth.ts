import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { snapdubClient } from './common/client';

export const snapdubAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API key:
1. Sign in to SnapDub and open [Settings, API keys](https://snapdub.ai/settings/api).
2. Click **Create key** and copy the key (it starts with \`sd_live_\`).
3. Paste it here.

The API comes with every paid SnapDub plan.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await snapdubClient.call({
        apiKey: auth,
        method: HttpMethod.GET,
        path: '/me',
      });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: snapdubClient.errorMessage({ error }),
      };
    }
  },
  getConnectionIdentifier: async ({ auth }) => {
    try {
      const me = await snapdubClient.call<{ account?: string; plan?: string }>({
        apiKey: auth,
        method: HttpMethod.GET,
        path: '/me',
      });
      if (!me.account) {
        return undefined;
      }
      return me.plan ? `${me.account} (${me.plan})` : me.account;
    } catch {
      return undefined;
    }
  },
});
