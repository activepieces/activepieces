import {
  AppConnectionValueForAuthProperty,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { AppConnectionType } from '@activepieces/shared';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const apiKeyAuth = PieceAuth.CustomAuth({
  displayName: 'API Key',
  description: `Authenticate with your Postiz API key. Triggers require manual webhook setup in your Postiz dashboard.\n\nTo get your API key:\n1. Log in to your Postiz dashboard\n2. Go to **Settings > Developers > Public API**\n3. Generate a new API key and copy it`,
  required: true,
  props: {
    base_url: Property.ShortText({
      displayName: 'Base URL',
      description:
        'The API base URL. Use `https://api.postiz.com/public/v1` for Postiz Cloud, or `https://your-domain.com/api/public/v1` for self-hosted instances.',
      required: true,
      defaultValue: 'https://api.postiz.com/public/v1',
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const baseUrl = auth.base_url?.trim().replace(/\/+$/, '');
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/is-connected`,
        headers: {
          Authorization: auth.api_key,
        },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid API key or base URL. Please check your credentials.',
      };
    }
  },
});

const jwtAuth = PieceAuth.CustomAuth({
  displayName: 'Email & Password (JWT)',
  description:
    'Authenticate with your Postiz email, password, and API key. This mode enables automatic webhook registration for triggers — no manual setup needed.',
  required: true,
  props: {
    base_url: Property.ShortText({
      displayName: 'Base URL',
      description:
        'Your Postiz instance URL. Use `https://app.postiz.com` for Postiz Cloud, or `https://your-domain.com` for self-hosted instances.',
      required: true,
      defaultValue: 'https://app.postiz.com',
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description:
        'Your API key is used for actions. Go to **Settings > Developers > Public API** to generate one.',
      required: true,
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
    const baseUrl = auth.base_url?.trim().replace(/\/+$/, '');
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/api/public/v1/is-connected`,
        headers: { Authorization: auth.api_key },
      });
    } catch {
      return {
        valid: false,
        error: 'Invalid API key or base URL.',
      };
    }
    try {
      await getJwtToken(auth.base_url, auth.email, auth.password);
    } catch {
      return {
        valid: false,
        error: 'Invalid email or password.',
      };
    }
    return { valid: true };
  },
});

export async function getJwtToken(
  baseUrl: string,
  email: string,
  password: string
): Promise<string> {
  const url = baseUrl.trim().replace(/\/+$/, '');
  const res = await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: `${url}/api/auth/login`,
    body: { provider: 'LOCAL', email, password },
  });
  const setCookie = res.headers?.['set-cookie'];
  if (setCookie) {
    const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
    for (const cookie of cookies) {
      const match = cookie.match(/auth=([^;]+)/);
      if (match) return match[1];
    }
  }
  const authHeader = res.headers?.['auth'];
  if (authHeader) return authHeader;
  throw new Error('Could not extract JWT from login response');
}

function isApiKeyAuth(
  auth: PostizAuthValue
): auth is PostizAuthValue & {
  type: typeof AppConnectionType.CUSTOM_AUTH;
  props: { base_url: string; api_key: string };
} {
  return auth.type === AppConnectionType.CUSTOM_AUTH && !('email' in auth.props);
}

export const postizAuth = [apiKeyAuth, jwtAuth];
export const isApiKeyAuthentication = isApiKeyAuth;

export type PostizAuthValue = AppConnectionValueForAuthProperty<
  typeof postizAuth
>;

export type PostizJwtAuthValue = AppConnectionValueForAuthProperty<
  typeof jwtAuth
>;

export type PostizApiKeyAuth = {
  props: {
    base_url: string;
    api_key: string;
  };
};
