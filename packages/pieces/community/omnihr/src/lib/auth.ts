import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

async function getAccessToken(auth: {
  username: string;
  password: string;
  origin: string;
}): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Origin: auth.origin,
  };

  const tokenResponse = await httpClient.sendRequest<{
    access: string;
    refresh: string;
    access_exp: string;
    refresh_exp: string;
  }>({
    method: HttpMethod.POST,
    url: 'https://api.omnihr.co/api/v1/auth/token/',
    headers,
    body: {
      username: auth.username,
      password: auth.password,
    },
  });

  return tokenResponse.body.access;
}

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
      await getAccessToken(auth);
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
      const accessToken = await getAccessToken(auth);
      return { access_token: accessToken };
    },
    // ponytail: expires_in not derived from the token response's access_exp/refresh_exp
    // yet, falls back to the framework's default (55min). Compute it from access_exp
    // if that window proves too aggressive or too lax.
  },
});

