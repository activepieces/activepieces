import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

import { replyIoRequest } from './common/client';

export const replyIoAuth = PieceAuth.CustomAuth({
  displayName: 'Reply.io',
  required: true,
  description: 'Use your Reply.io API key. The piece sends both Api-Key and X-Api-Key headers with the same value for compatibility because public references conflict on the exact header name.',
  props: {
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Reply.io API key.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await replyIoRequest({
        apiKey: auth.api_key,
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
