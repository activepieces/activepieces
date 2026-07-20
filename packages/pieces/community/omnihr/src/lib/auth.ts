import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const ACCESS_TOKEN_EXPIRY_BUFFER_SECONDS = 5 * 60;
const OMNIHR_TOKEN_URL = 'https://api.omnihr.co/api/v1/auth/token/';

export const omnihrAuth = PieceAuth.CustomAuth({
  description: 'Enter your OmniHR credentials to authenticate:',
  required: true,
  props: {
    username: Property.ShortText({
      displayName: 'Username',
      description: 'Your OmniHR email address',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'Your OmniHR password',
      required: true,
    }),
    origin: Property.ShortText({
      displayName: 'Origin',
      description: 'Your OmniHR origin URL',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: OMNIHR_TOKEN_URL,
        headers: {
          'Content-Type': 'application/json',
          Origin: auth.origin,
        },
        body: {
          username: auth.username,
          password: auth.password,
        },
      });
      return {
        valid: true,
      };
    } catch (error: unknown) {
      return {
        valid: false,
        error: `Authentication failed: ${
          (error as Error).message || 'Invalid credentials'
        }`,
      };
    }
  },
  refresh: {
    generate: async ({ auth }) => {
      const tokenResponse = await httpClient.sendRequest<{
        access: string;
        refresh: string;
        access_exp: string;
        refresh_exp: string;
      }>({
        method: HttpMethod.POST,
        url: OMNIHR_TOKEN_URL,
        headers: {
          'Content-Type': 'application/json',
          Origin: auth.origin,
        },
        body: {
          username: auth.username,
          password: auth.password,
        },
      });

      const expiresIn =
        Number(tokenResponse.body.access_exp) -
        Math.floor(Date.now() / 1000) -
        ACCESS_TOKEN_EXPIRY_BUFFER_SECONDS;

      return { access_token: tokenResponse.body.access, expires_in: expiresIn };
    },
  },
});

