import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wavixApiCall } from './client';

const description = `
Authenticate with a Wavix API key.

1. Open **[API keys](https://app.wavix.com/profile/api-keys)** in the Wavix portal.
2. Create a **dedicated API key** for Activepieces.
`;

export const wavixAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description,
  validate: async ({ auth }) => {
    try {
      await wavixApiCall({
        apiKey: auth,
        method: HttpMethod.GET,
        resourcePath: '/v1/profile/config',
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid Wavix API key.',
      };
    }
  },
});
