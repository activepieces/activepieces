import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const OMNIHR_TOKEN_URL = 'https://api.omnihr.co/api/v1/auth/token/';
const DEFAULT_EXPIRES_IN_SECONDS = 3300;
const REFRESH_BUFFER_SECONDS = 300; // refresh slightly before actual expiry

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
      await fetchOmniHrToken(auth);
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
      const { access, access_exp } = await fetchOmniHrToken(auth);

      if (!access_exp) {
        return {
          access_token: access,
        };
      }

      const nowEpoch = Math.floor(Date.now() / 1000);
      const accessExpEpoch = Number(access_exp);

      return {
        access_token: access,
        expires_in: Math.max(1, accessExpEpoch - nowEpoch - REFRESH_BUFFER_SECONDS),
      };
    },
    defaultExpiresIn: DEFAULT_EXPIRES_IN_SECONDS,
  },
});

async function fetchOmniHrToken({
  username,
  password,
  origin,
}: OmniHrAuthProps): Promise<OmniHrTokenResponse> {
  const response = await httpClient.sendRequest<OmniHrTokenResponse>({
    method: HttpMethod.POST,
    url: OMNIHR_TOKEN_URL,
    headers: {
      'Content-Type': 'application/json',
      Origin: origin,
    },
    body: {
      username,
      password,
    },
  });

  return response.body;
}

type OmniHrAuthProps = {
  username: string;
  password: string;
  origin: string;
};

type OmniHrTokenResponse = {
  access: string;
  refresh: string;
  access_exp: string;
  refresh_exp?: string | number;
};
