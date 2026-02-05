import { PieceAuth } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { BASE_URL } from './constants';

export const chaindeskAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `You can obtain API key from [Account Settings](https://app.chaindesk.ai/account).`,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: BASE_URL + '/conversations',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      });

      return {
        valid: true,
      };
    } catch {
      return {
        valid: false,
        error: 'Invalid API key',
      };
    }
  },
});
