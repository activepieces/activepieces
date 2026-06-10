import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { baseUrl } from './common/common';

export const avianAuth = PieceAuth.SecretText({
  description: `
      Follow these instructions to get your Avian API Key:

1. Visit https://avian.io and sign up for an account.
2. Navigate to the API Keys section of your dashboard.
3. Create a new API key and copy it.`,
  displayName: 'API Key',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/balance`,
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
        error: `${e}`,
      };
    }
  },
});
