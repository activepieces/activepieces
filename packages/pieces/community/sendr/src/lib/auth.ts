import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const sendrAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
**How to get your API key:**
1. Log in to your Sendr dashboard at https://app.sendr.io.
2. Go to **Settings > API Keys**.
3. Click **Create New Key**.
4. Copy the key and paste it below.

Need help? Contact Sendr support at https://sendr.io/support`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url:  'https://api.sendr.io/seat/me',
        headers: { Authorization: `Bearer ${auth}` },
      });
      return { valid: true };
    } catch (e) {
      return { valid: false, error: 'Invalid API Key. Please verify your key and try again.' };
    }
  },
});
