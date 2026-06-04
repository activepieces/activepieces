import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sliteApi } from './common/client';

const markdownDescription = `
**Authenticate with your Slite API key.**

1. Open your organization menu at the top-left of the Slite app.
2. Go to **Settings → API**.
3. Click **Create a new key** and follow the steps.
4. Copy the key (it is shown only once) and paste it here.
`;

export const sliteAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      await sliteApi.call({
        apiKey: auth,
        method: HttpMethod.GET,
        resourceUri: '/me',
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error:
          'Invalid API key. Generate one in Slite under Settings → API, then paste it here.',
      };
    }
  },
});
