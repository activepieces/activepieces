import {
  AppConnectionValueForAuthProperty,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const description = `Connect to Baserow using either a Database Token (recommended) or your Email & Password. Fill in only the fields for your chosen method — leave the other section blank.`;

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
        'Choose **Database Token** (recommended) for scoped, per-table access compatible with 2FA. Choose **Email & Password** only if you need automatic webhook registration on triggers — 2FA accounts are not supported.',
      required: true,
      defaultValue: 'database_token',
      options: {
        disabled: false,
        options: [
          { label: 'Database Token (recommended)', value: 'database_token' },
          { label: 'Email & Password (JWT)', value: 'jwt' },
        ],
      },
    }),
    apiUrl: Property.ShortText({
      displayName: 'API URL',
      description: 'Your Baserow instance URL. Leave the default for Baserow Cloud.',
      required: true,
      defaultValue: 'https://api.baserow.io',
    }),
    md_token: Property.MarkDown({
      value: `---
#### 🔑 Database Token
Go to **Settings → Database tokens** in Baserow, create a token, copy it, and paste it below. Leave Email and Password blank.`,
    }),
    token: PieceAuth.SecretText({
      displayName: 'Database Token',
      description: 'Your Baserow database token. Leave blank when using Email & Password.',
      required: false,
    }),
    md_jwt: Property.MarkDown({
      value: `---
#### 👤 Email & Password (JWT)
Enter your Baserow login credentials below. Leave Database Token blank. Accounts with 2FA enabled are not supported.`,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Your Baserow account email. Leave blank when using Database Token.',
      required: false,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'Your Baserow account password. Leave blank when using Database Token.',
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
