import { PieceAuth } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';

export const frontAuth = PieceAuth.SecretText({
  displayName: 'Front API Token',
  description:
    'Your Front API token. You can create one from your Front settings under "Developers". Ensure the token has the necessary scopes.',
  required: true,
  validate: async ({ auth }: { auth: string }) => {
    if (!auth) {
      return {
        valid: false,
        error: 'API Token cannot be empty.',
      };
    }
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api2.frontapp.com/me',
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
        error: 'Invalid API Token.',
      };
    }
  },
});