import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './common/client';

export const lucidyaAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API Key:

1. Log in to your Lucidya account
2. Navigate to **Settings**
3. Select **Lucidya API** from the left menu
4. Click **Generate API Key** and select "Social Listening API"
5. Copy and securely store your API token`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await makeRequest(auth, HttpMethod.GET, '/monitors_list', { page_id: '1' });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid API Key',
      };
    }
  },
});
