import { AppConnectionType, PieceAuth } from '@activepieces/pieces-framework';
import { telnyxApi } from './common/api';

export const telnyxAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Telnyx API key.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await telnyxApi.listMessagingProfiles({
        auth: { type: AppConnectionType.SECRET_TEXT, secret_text: auth },
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
