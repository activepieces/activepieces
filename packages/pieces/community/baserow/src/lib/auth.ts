import {
  AppConnectionValueForAuthProperty,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const description = `Choose how you want to authenticate with Baserow:

**Database Token** — recommended. Per-table CRUD scoping, compatible with 2FA accounts. Triggers require manual webhook setup.
  1. Log in to your Baserow account.
  2. Click on your profile picture (top-left) and go to **Settings → Database tokens**.
  3. Create a new token, then click **:** beside the token name to copy it.
  4. Paste it into **Database Token** below. Leave **Email** and **Password** empty.

**Email & Password (JWT)** — workspace-wide access, enables automatic webhook registration for triggers. Not compatible with accounts that have 2FA enabled.
  1. Fill in **Email** and **Password** with your Baserow login credentials. Leave **Database Token** empty.

In both modes, set **API URL** to your Baserow instance (default: \`https://api.baserow.io\`).`;

function isJwtMode(authType: string | undefined, props: { token?: string; email?: string; password?: string }): boolean {
  if (authType === 'jwt') return true;
  if (authType === 'database_token') return false;
  return Boolean(props.email && props.password && !props.token);
}

export const baserowAuth = PieceAuth.CustomAuth({
  displayName: 'Authentication',
  description,
  required: true,
  props: {
    authType: Property.StaticDropdown({
      displayName: 'Authentication Method',
      description:
        'Database Token is recommended. Use Email & Password (JWT) only if you need automatic webhook registration on triggers.',
      required: true,
      defaultValue: 'database_token',
      options: {
        disabled: false,
        options: [
          { label: 'Database Token', value: 'database_token' },
          { label: 'Email & Password (JWT)', value: 'jwt' },
        ],
      },
    }),
    apiUrl: Property.ShortText({
      displayName: 'API URL',
      required: true,
      defaultValue: 'https://api.baserow.io',
    }),
    token: PieceAuth.SecretText({
      displayName: 'Database Token',
      description: 'Required if Authentication Method is **Database Token**. Leave empty for JWT.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Required if Authentication Method is **Email & Password (JWT)**. Leave empty for Database Token.',
      required: false,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'Required if Authentication Method is **Email & Password (JWT)**. Leave empty for Database Token.',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    if (isJwtMode(auth.authType, auth)) {
      if (!auth.email || !auth.password) {
        return {
          valid: false,
          error: 'Email and Password are required for JWT authentication.',
        };
      }
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
    }
    if (!auth.token) {
      return {
        valid: false,
        error: 'Database Token is required when using Database Token authentication.',
      };
    }
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

export const baserowAuthHelpers = {
  isJwtAuth: (auth: BaserowAuthValue): boolean =>
    isJwtMode(auth.props.authType, auth.props),
};

export type BaserowAuthValue = AppConnectionValueForAuthProperty<typeof baserowAuth>;
