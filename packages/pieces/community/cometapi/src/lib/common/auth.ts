import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

const markdownDescription = `
Follow these instructions to get your CometAPI Key:

1. Visit the CometAPI Dashboard: https://api.cometapi.com/console/token
2. Go to the API settings page to get your key.
3. Copy the key and paste it below.
`;

export const BASE_URL = 'https://api.cometapi.com/v1';

export const cometApiAuth = PieceAuth.SecretText({
  description: markdownDescription,
  displayName: 'API Key',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        url: BASE_URL + '/models',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth as string,
        },
        method: HttpMethod.GET,
      });

      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid API Key.',
      };
    }
  },
});
