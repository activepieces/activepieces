import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const cloudconvertAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
  To connect your account, get your API Key from the CloudConvert Dashboard:
  1. Go to your **API Keys** page (https://cloudconvert.com/dashboard/api/v2/keys).
  2. Click **Create API Key** and give it a name (e.g., "Activepieces").
  3. Enable the following permissions for the key:
     - **\`task.read\`** & **\`task.write\`** (to create and manage conversion jobs)
     - **\`webhook.read\`** & **\`webhook.write\`** (to enable instant triggers)
  4. Click **Create** and paste the generated API Key below.
  `,
  required: true,

  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.cloudconvert.com/v2/users/me',
        headers: {
          Authorization: `Bearer ${auth}`,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API key. Please check the key and permissions.',
      };
    }
  },
});
