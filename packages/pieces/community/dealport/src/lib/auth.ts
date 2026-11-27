import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { dealportRequest, statusOfError } from './common/client';

const authDescription = `
Create a workspace API key (\`dp_live_...\`) at [Dealport Connect](https://app.dealport.com/connect?tab=keys). New pay-as-you-go API accounts start with a \`$5.00\` free balance.
`;

export const dealportAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: authDescription,
  required: true,
  validate: async ({ auth }) => {
    if (!auth || !auth.trim()) {
      return { valid: false, error: 'API Key is required.' };
    }
    try {
      await dealportRequest({
        apiKey: auth,
        method: HttpMethod.GET,
        path: '/balance',
      });
      return { valid: true };
    } catch (error) {
      const status = statusOfError(error);
      if (status === 401 || status === 403) {
        return { valid: false, error: 'Invalid Dealport API Key.' };
      }
      return {
        valid: false,
        error: `Could not verify the API key with Dealport${
          status ? ` (HTTP ${status})` : ''
        }.`,
      };
    }
  },
});
