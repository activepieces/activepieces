import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const capsuleCrmAuth = PieceAuth.OAuth2({
  description: `
  To get your Client ID and Secret:
  1. Log in to your Capsule CRM account.
  2. Go to your **Account Settings** > **Integrations** > **Registered Applications**.
  3. Click **Register new application**.
  4. Fill in the details. For the **Redirect URL**, you'll get it from the Activepieces connection dialog.
  5. Once registered, copy your **Client ID** and **Client Secret**.
  `,
  authUrl: "https://api.capsulecrm.com/oauth/authorise",
  tokenUrl: "https://api.capsulecrm.com/oauth/token",
  required: true,
  scope: ['read', 'write'],
  props: {
    client_id: Property.ShortText({
      displayName: 'Client ID',
      required: true,
    }),
    client_secret: PieceAuth.SecretText({
      displayName: 'Client Secret',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.capsulecrm.com/api/v2/users',
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
        error: 'Invalid API credentials. Please check your Client ID and Secret.',
      };
    }
  },
});