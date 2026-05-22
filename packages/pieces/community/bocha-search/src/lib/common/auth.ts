import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './client';

const markdownDescription = `
Follow these steps to obtain your Bocha API Key:

1. Visit [Bocha AI Open Platform](https://open.bochaai.com) and create an account.
2. Navigate to **API KEY Management** in the dashboard.
3. Copy your API key.
`;

export const bochaAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      await makeRequest({
        token: auth,
        method: HttpMethod.POST,
        path: '/web-search',
        body: { query: 'test', count: 1 },
      });
      return {
        valid: true,
      };
    }
    catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key',
      };
    }
  },
});
