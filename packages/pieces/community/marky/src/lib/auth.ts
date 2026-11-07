import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

import { markyCommon } from './common/client';

export const markyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your Marky API key:
1. Sign in to Marky as an organization admin
2. Open **Settings > API Keys** (https://app.mymarky.ai/org/settings#api-keys)
3. Click **Create API Key**, name it, and copy the \`mk_live_...\` value — it is only shown once`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await markyCommon.apiCall({
        apiKey: auth,
        method: HttpMethod.GET,
        path: '/businesses',
        queryParams: { limit: '1' },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid API key. Check the key and try again.',
      };
    }
  },
});
