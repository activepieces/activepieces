import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

import { tapfiliateApiCall } from './tapfiliate.client';

export const tapfiliateAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To obtain your API key:

1. Log in to your Tapfiliate account.
2. Open your account settings.
3. Find the API key section.
4. Copy the API key and paste it here.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await tapfiliateApiCall({
        method: HttpMethod.GET,
        path: '/affiliates/',
        apiKey: auth,
      });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid API Key.' };
    }
  },
});
