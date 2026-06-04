import { PieceAuth } from '@activepieces/pieces-framework';

import { postmarkClient, MessageStreamListResponse } from './common/client';

export const postmarkAuth = PieceAuth.SecretText({
  displayName: 'Server API Token',
  description:
    'Create or copy a Postmark Server API Token from Servers → API Tokens in Postmark.',
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await postmarkClient.get<MessageStreamListResponse>(
        auth,
        '/message-streams'
      );

      if (!response || !Array.isArray(response.MessageStreams)) {
        return {
          valid: false,
          error: 'Unexpected response while validating Postmark token.',
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to validate Postmark Server API Token.',
      };
    }
  },
});
