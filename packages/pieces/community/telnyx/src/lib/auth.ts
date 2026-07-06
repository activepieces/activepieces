import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { telnyxRequest } from './common/client';

export const telnyxAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Telnyx API key.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await telnyxRequest({
        apiKey: auth,
        method: HttpMethod.GET,
        path: '/messaging_profiles',
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid API key or unable to reach the Telnyx API.',
      };
    }
  },
});
