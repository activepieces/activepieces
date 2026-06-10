import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

import { replyIoRequest } from './common/client';

export const replyIoAuth = PieceAuth.SecretText({
  displayName: 'Reply.io',
  required: true,
  description: 'Your Reply.io API key. Find it in Reply.io under **Settings → API**.',
  
  validate: async ({ auth }) => {
    try {
      await replyIoRequest({
        apiKey: auth,
        method: HttpMethod.GET,
        path: '/v1/campaigns',
      });
      return { valid: true };
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) {
        return { valid: false, error: 'Invalid API key.' };
      }
      return {
        valid: false,
        error: 'Could not reach the Reply.io API. Check your API key and network access.',
      };
    }
  },
});
