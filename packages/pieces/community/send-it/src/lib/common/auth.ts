import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SendItApiError, apiKeyOf, sendItApi } from './client';

export const sendItAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your SendIt API key:
1. Log in to your [SendIt dashboard](https://sendit.infiniteappsai.com/dashboard)
2. Go to **Settings > API Keys**
3. Click **Create API Key** — the key is only shown once, so copy it immediately
4. Paste the key below (it starts with \`sk_live_\`)`,
  required: true,
  validate: async ({ auth }) => {
    const apiKey = apiKeyOf(auth);
    if (apiKey === '') {
      return { valid: false, error: 'Enter your SendIt API key.' };
    }
    try {
      await sendItApi.request({ apiKey, method: HttpMethod.GET, path: '/accounts', operation: 'validate API key', query: { limit: 1 } });
      return { valid: true };
    } catch (error) {
      if (error instanceof SendItApiError && (error.status === 401 || error.status === 403)) {
        return { valid: false, error: 'Invalid API key. Make sure you copied the full key starting with sk_live_.' };
      }
      return { valid: false, error: `Could not reach SendIt to check the key: ${error instanceof Error ? error.message : String(error)}` };
    }
  },
});
