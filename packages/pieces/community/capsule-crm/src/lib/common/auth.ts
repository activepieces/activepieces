import { PieceAuth } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';

export const capsuleCrmAuth = PieceAuth.SecretText({
  displayName: 'Personal Access Token',
  description: `
  To get your Personal Access Token:
  1. Log in to your Capsule CRM account.
  2. Click on your name in the top right corner and go to **My Preferences**.
  3. Select **API & Webhooks** from the left-hand menu.
  4. Under **Personal Access Tokens**, click **Generate new API token**.
  5. Give the token a descriptive name (e.g., "Activepieces") and copy the generated token.
  `,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.capsulecrm.com/api/v2/users/me',
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
        error:
          'Invalid Personal Access Token. Please check your token and try again.',
      };
    }
  },
});
