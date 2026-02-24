import { PieceAuth } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { BASE_URL } from './constants';

export const chatnodeAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description:
    'To generate an API key, go to Team Settings and navigate to the API Access tab. There, you’ll find the option to generate a new API key.',
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: BASE_URL + '/auth_me',
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
        error: 'Invalid API Key',
      };
    }
  },
});
