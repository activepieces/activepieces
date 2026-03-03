import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

export const smailyAuth = PieceAuth.CustomAuth({
  description: `
  1. Click on profile pic (top right corner), navigate to **Preferences**.
  2. Go to **Integrations** tab and click on **Create a New User**.
  3. Copy generated domain, user and password.`,
  required: true,
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      required: true,
    }),
    username: Property.ShortText({
      displayName: 'User Name',
      required: true,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://${auth.domain}.sendsmaily.net/api/organizations/users.php`,
        authentication: {
          type: AuthenticationType.BASIC,
          username: auth.username,
          password: auth.password,
        },
      });
      return {
        valid: true,
      };
    } catch {
      return {
        valid: false,
        error: 'Please provide correct credentials.',
      };
    }
  },
});
