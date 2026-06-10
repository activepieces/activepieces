import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const BASE_URL = 'https://sendit.infiniteappsai.com/api/v1';

export const sendItAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your SendIt API key:
1. Log in to your [SendIt dashboard](https://sendit.infiniteappsai.com/dashboard)
2. Go to **Settings > API Keys**
3. Click **Create API Key** — the key is only shown once, so copy it immediately
4. Paste the key below (it starts with \`sk_live_\`)`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${BASE_URL}/accounts`,
        headers: { Authorization: `Bearer ${auth}` },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error:
          'Invalid API key. Make sure you copied the full key starting with sk_live_.',
      };
    }
  },
});
