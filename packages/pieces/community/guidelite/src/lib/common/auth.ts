import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { AppConnectionType } from '@activepieces/shared';

export const guideliteAuth = PieceAuth.SecretText({
  displayName: 'Guidelite API Key',
  description: `
To get your API key:
1. Sign in to your GuideLite dashboard
2. Click on your account in the left panel
3. Select "Profile" from the dropdown menu
4. Navigate to the API Keys tab and click "Generate API Key"
5. Copy your unique API key (you won't be able to view it again unless you delete and create a new one)

For more information, visit: https://docs.guidelite.ai/reference/quickstart
`,
  required: true,
  validate: async ({ auth }) => {
    if (auth) {
      try {
        await makeRequest({secret_text: auth, type: AppConnectionType.SECRET_TEXT}, HttpMethod.GET, '/assistant/list');
        return {
          valid: true,
        };
      } catch (error) {
        return {
          valid: false,
          error: 'Invalid API Key',
        };
      }
    }
    return {
      valid: false,
      error: 'Invalid API Key',
    };
  },
});
