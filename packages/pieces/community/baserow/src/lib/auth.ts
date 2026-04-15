import {
  AppConnectionValueForAuthProperty,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { AppConnectionType } from '@activepieces/shared';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const databaseTokenAuth = PieceAuth.CustomAuth({
  displayName: 'Database Token',
  description: `
  1. Log in to your Baserow Account.
  2. Click on your profile-pic(top-left) and navigate to **Settings->Database tokens**.
  3. Create new token with any name and appropriate workspace.
  4. After token creation,click on **:** right beside token name and copy database token.
  5. Enter your Baserow API URL.If you are using baserow.io, you can leave the default one.`,
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
  description: `Authenticate with your Baserow email and password. This mode enables automatic webhook registration for triggers — no manual setup needed.\n\n**Note:** Two-factor authentication (2FA) is not supported. If your Baserow account has 2FA enabled, use the Database Token authentication instead.`,
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
        error: 'Invalid email, password, or API URL.',
      };
    }
  },
});

function isDatabaseToken(
  auth: BaserowAuthValue
): auth is BaserowAuthValue & {
  type: typeof AppConnectionType.CUSTOM_AUTH;
  props: { apiUrl: string; token: string };
} {
  return (
    auth.type === AppConnectionType.CUSTOM_AUTH && 'token' in auth.props
  );
}

export const baserowAuth = [databaseTokenAuth, jwtAuth];
export const baserowJwtAuth = jwtAuth;
export const isDatabaseTokenAuth = isDatabaseToken;

export type BaserowAuthValue = AppConnectionValueForAuthProperty<
  typeof baserowAuth
>;

export type BaserowJwtAuthValue = AppConnectionValueForAuthProperty<
  typeof baserowJwtAuth
>;
