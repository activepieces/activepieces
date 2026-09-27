import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { kleapRequest } from './common/client';

export const kleapAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your Kleap API key:
1. Log in to [kleap.co](https://kleap.co).
2. Open https://kleap.co/settings/api-key (Settings → API & automations).
3. Create a key with the **Full** preset (it covers apps, files, forms, analytics, domains and the app database).
4. Copy the key (it starts with \`kleap_live_sk_\`) and paste it below.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await kleapRequest(auth, HttpMethod.GET, '/account/credits');
      return { valid: true };
    } catch (error) {
      return { valid: false, error: (error as Error).message || 'Invalid Kleap API key.' };
    }
  },
});
