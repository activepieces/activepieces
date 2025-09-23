import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { Server } from './types';
import { fetchUrls, getAccessToken } from './helper';

export const promptxAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    server: Property.StaticDropdown<Server>({
      displayName: 'Server',
      options: {
        options: [
          {
            label: 'Production',
            value: 'production',
          },
          {
            label: 'Test',
            value: 'staging',
          },
        ],
      },
      required: true,
      defaultValue: 'production',
    }),
    username: Property.ShortText({
      displayName: 'Username',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      required: true,
    }),
    customAuthUrl: Property.ShortText({
      displayName: 'Custom Auth URL',
      description: 'Optional custom URL of the authentication service',
      required: false,
    }),
    customAppUrl: Property.ShortText({
      displayName: 'Custom App URL',
      description: 'Optional custom URL of the application service',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    const {
      server = 'production',
      username,
      password,
      customAuthUrl,
      customAppUrl,
    } = auth;

    if (!username || !password) {
      return {
        valid: false,
        error: 'Empty Username or Password',
      };
    }

    try {
      const urls = fetchUrls(server, customAuthUrl, customAppUrl);
      await getAccessToken(urls.CENTER_AUTH_LOGIN_URL, username, password);
    } catch (error) {
      return {
        valid: false,
        error: `Authentication failed with Error ${
          error instanceof Error ? error.message : error
        }`,
      };
    }
    return { valid: true };
  },
});
