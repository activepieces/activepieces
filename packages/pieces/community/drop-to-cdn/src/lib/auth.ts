import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { dropToCdnApiCall } from './client';

export const dropToCdnAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Create an API key at [Drop to CDN → Settings → API keys](https://droptocdn.com/dashboard/settings). Keys start with `dtc_`.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await dropToCdnApiCall({
        apiKey: auth,
        method: HttpMethod.GET,
        resourceUri: '/profile',
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error:
          'Invalid API key. Check your key in Drop to CDN → Settings → API keys.',
      };
    }
  },
});
