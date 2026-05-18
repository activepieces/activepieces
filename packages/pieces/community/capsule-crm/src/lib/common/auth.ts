import { OAuth2PropertyValue, PieceAuth } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';

export const capsuleCrmAuth = PieceAuth.OAuth2({
  description: `
  To authenticate with Capsule CRM:
  1. Go to your Capsule CRM user settings.
  2. Navigate to "My Preferences" > "API Authentication Tokens".
  3. Register a new application to get a Client ID and Client Secret.
  4. Add https://cloud.activepieces.com/redirect to the authorized redirect URIs.
  5. Use the OAuth2 flow below.`,
  authUrl: 'https://api.capsulecrm.com/oauth/authorise',
  tokenUrl: 'https://api.capsulecrm.com/oauth/token',
  required: true,
  scope: ['read', 'write'],
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.capsulecrm.com/api/v2/site',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.access_token,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid credentials',
      };
    }
  },
});

export type CapsuleCrmAuthType = OAuth2PropertyValue;
