import { PieceAuth } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';

export const timelinesAiAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description:
    'Your TimelinesAI API token, found in your account under the Public API section.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://app.timelines.ai/integrations/api/whatsapp_accounts',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth, 
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Token',
      };
    }
  },
});
