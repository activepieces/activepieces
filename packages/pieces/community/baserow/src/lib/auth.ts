import {
  AppConnectionValueForAuthProperty,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const databaseTokenAuth = PieceAuth.CustomAuth({
  displayName: 'Database Token',
  description: `
  1. Log in to your Baserow Account.
  2. Click on your profile-pic(top-left) and navigate to **Settings->Database tokens**.
  3. Create new token with any name and appropriate workspace.
  4. After token creation,click on **:** right beside token name and copy database token.
  5. Enter your Baserow API URL.If you are using baserow.io, you can leave the default one.

**Note:** Database tokens cannot register webhooks via API. Triggers will require manual webhook setup. To enable automatic webhook registration, use the **Email & Password (JWT)** authentication method.`,
  required: true,
  props: {
    apiUrl: Property.ShortText({
      displayName: 'API URL',
      required: true,
      defaultValue: 'https://api.baserow.io',
    }),
    token: PieceAuth.SecretText({
      displayName: 'Database Token',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${auth.apiUrl}/api/database/tables/all-tables/`,
        headers: { Authorization: `Token ${auth.token}` },
      });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid database token or API URL.' };
    }
  },
});

const jwtAuth = PieceAuth.CustomAuth({
  displayName: 'Email & Password (JWT)',
  description: `Authenticate with your Baserow email and password. This mode enables automatic webhook registration for triggers — no manual setup needed.

**Note:** Two-factor authentication (2FA) is not supported. If your Baserow account has 2FA enabled, use the Database Token authentication instead.`,
  required: true,
  props: {
    apiUrl: Property.ShortText({
      displayName: 'API URL',
      required: true,
      defaultValue: 'https://api.baserow.io',
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${auth.apiUrl}/api/user/token-auth/`,
        body: { email: auth.email, password: auth.password },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error:
          'Invalid email, password, or API URL. Note: 2FA is not supported — use Database Token if 2FA is enabled.',
      };
    }
  },
});

function hasJwtCredentials(
  auth: BaserowAuthValue,
): auth is BaserowAuthValue & { props: BaserowJwtAuthProps } {
  return 'email' in auth.props && 'password' in auth.props;
}

export const baserowAuth = [databaseTokenAuth, jwtAuth];

export const baserowAuthHelpers = {
  isJwtAuth: hasJwtCredentials,
};

export type BaserowAuthValue = AppConnectionValueForAuthProperty<typeof baserowAuth>;

export type BaserowJwtAuthProps = {
  apiUrl: string;
  email: string;
  password: string;
};

export type BaserowDatabaseTokenAuthProps = {
  apiUrl: string;
  token: string;
};
