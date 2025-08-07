import { PieceAuth, Property } from '@activepieces/pieces-framework';

import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './client';

export const MollieAuth = PieceAuth.SecretText({
  displayName: 'Mollie API Key',
  description: `
To obtain your Mollie API key:
1. Log in to your Mollie Dashboard
2. Go to Settings > Website profiles
3. Select your website profile
4. Copy the API key (starts with 'live_' for production or 'test_' for testing)

More info: https://docs.mollie.com/reference/authentication
`,
  required: true,
  validate: async ({ auth }) => {
    if (auth) {
      try {
        await makeRequest(auth as string, HttpMethod.GET, '/methods');
        return {
          valid: true,
        };
      } catch (error) {
        return {
          valid: false,
          error:
            'Invalid Mollie API Key. Please check that your API key is correct and starts with "live_" or "test_".',
        };
      }
    }
    return {
      valid: false,
      error: 'Mollie API Key is required',
    };
  },
});
