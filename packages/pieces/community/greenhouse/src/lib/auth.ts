import { PieceAuth } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';

export const greenhouseAuth = PieceAuth.SecretText({
  displayName: 'Harvest API Key',
  description: `To get your Harvest API key:

1. Log in to Greenhouse and go to **Configure** (gear icon, top-right).
2. Click **Dev Center** in the left sidebar.
3. Select **API Credential Management**.
4. Click **Create New API Key**, choose **Harvest**, and set the permissions your flow needs.
5. Copy the generated key and paste it here.

**Note:** The API key is used as the username in HTTP Basic auth — Greenhouse expects the password to be left empty.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://harvest.greenhouse.io/v1/jobs',
        authentication: {
          type: AuthenticationType.BASIC,
          username: auth,
          password: '',
        },
        queryParams: { per_page: '1' },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error:
          'Invalid API key. Double-check the key in Greenhouse → Configure → Dev Center → API Credential Management.',
      };
    }
  },
});
