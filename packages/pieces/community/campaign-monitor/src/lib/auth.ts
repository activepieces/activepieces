import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './common/client';

const markdownDescription = `
To use Campaign Monitor, you need to get an API key:
1. Login to your account at https://www.campaignmonitor.com.
2. Navigate to Account Settings.
3. Click on API Keys.
4. Create a new API key or use an existing one.
`;

export const campaignMonitorAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      await makeRequest({
        auth: { apiKey: auth },
        method: HttpMethod.GET,
        path: '/systemdate.json',
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error:
          'Invalid API key. Copy it from Account Settings → API keys in Campaign Monitor.',
      };
    }
  },
});
