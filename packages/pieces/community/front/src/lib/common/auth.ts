import { PieceAuth } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';

// The base URL for the Front API
const frontApiUrl = 'https://api2.frontapp.com';

export const frontAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description:
    'Your Front API token. Create one from your Front settings under "Developers".',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${frontApiUrl}/me`,
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