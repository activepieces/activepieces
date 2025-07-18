import { PieceAuth } from '@activepieces/pieces-framework';
import { edenApiCall } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const edenAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'You can find your Eden AI API key on the Eden AI dashboard homepage. The key should be used as a Bearer token.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await edenApiCall({
        method: HttpMethod.GET,
        auth: { apiKey: auth },
        resourceUri: '/aiproducts',
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid Eden AI API Key',
      };
    }
  },
});
