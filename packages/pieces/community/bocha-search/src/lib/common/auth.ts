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
    catch (e: unknown) {
      const status =
        e instanceof Error &&
        'response' in e &&
        typeof (e as { response: { status: number } }).response?.status === 'number'
          ? (e as { response: { status: number } }).response.status
          : undefined;
      if (status === 401 || status === 403) {
        return { valid: false, error: 'Invalid API Key' };
      }
      return { valid: false, error: 'Could not connect to Bocha API. Please try again.' };
    }
  },
});
