import {
  AppConnectionValueForAuthProperty,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { HttpHeaders, HttpMethod, httpClient } from '@activepieces/pieces-common';

const DEFAULT_PUBLIC_API_URL = 'https://api.postiz.com/public/v1';

const description = `Connect to Postiz with an API Key. Add your email and password on top of it only if you want the **New Published Post** trigger to register its webhook for you — every action always goes through the API key.`;

function normalizeUrl(url: string | undefined): string {
  return (url ?? '').trim().replace(/\/+$/, '');
}

function publicApiUrl(baseUrl: string | undefined): string {
  return normalizeUrl(baseUrl) || DEFAULT_PUBLIC_API_URL;
}

function instanceApiUrl(baseUrl: string | undefined): string {
  return publicApiUrl(baseUrl).replace(/\/public\/v1$/, '');
}

function isJwtMode({
  authType,
  props,
}: {
  authType: string | undefined;
  props: { email?: string; password?: string };
}): boolean {
  if (authType === 'jwt') return true;
  if (authType === 'api_key') return false;
  return Boolean(props.email && props.password);
}

function readAuthToken(headers: HttpHeaders | undefined): string | undefined {
  const authHeader = headers?.['auth'];
  if (typeof authHeader === 'string' && authHeader.length > 0) {
    return authHeader;
  }
  const setCookie = headers?.['set-cookie'];
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie ?? ''];
  for (const cookie of cookies) {
    const match = cookie.match(/(?:^|[,;]\s*)auth=([^;,\s]+)/);
    if (match) {
      return match[1];
    }
  }
  return undefined;
}

async function fetchSessionToken({
  baseUrl,
  email,
  password,
}: {
  baseUrl: string | undefined;
  email: string;
  password: string;
}): Promise<string> {
  const response = await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: `${instanceApiUrl(baseUrl)}/auth/login`,
    body: { provider: 'LOCAL', email, password },
  });
  const token = readAuthToken(response.headers);
  if (!token) {
    throw new Error(
      'Postiz accepted the sign in but returned no session token. Check that the Base URL points at your Postiz API.'
    );
  }
  return token;
}

export const postizAuth = PieceAuth.CustomAuth({
  displayName: 'Postiz Connection',
  description,
  required: true,
  props: {
    authType: Property.StaticDropdown({
      displayName: 'Authentication Method',
      description:
        'Choose **API Key** for actions and a manually created webhook. Choose **API Key + Email & Password** to also let the **New Published Post** trigger create and delete its webhook in Postiz for you.',
      required: true,
      defaultValue: 'api_key',
      options: {
        disabled: false,
        options: [
          { label: 'API Key', value: 'api_key' },
          { label: 'API Key + Email & Password', value: 'jwt' },
        ],
      },
    }),
    base_url: Property.ShortText({
      displayName: 'Base URL',
      description:
        'The API base URL. Use `https://api.postiz.com/public/v1` for Postiz Cloud, or `https://your-domain.com/api/public/v1` for self-hosted instances.',
      required: true,
      defaultValue: DEFAULT_PUBLIC_API_URL,
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: `Required for both methods. To get your API key:
1. Log in to your Postiz dashboard
2. Go to **Settings > Developers > Public API**
3. Generate a new API key and copy it`,
      required: true,
    }),
    md_jwt: Property.MarkDown({
      value: `---
#### 👤 Email & Password
Only fill these in for **API Key + Email & Password**. They are used to sign in to your Postiz instance so the **New Published Post** trigger can register its own webhook. Leave both blank when using **API Key**.`,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Your Postiz account email. Leave blank when using API Key.',
      required: false,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description:
        'Your Postiz account password. Leave blank when using API Key.',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${publicApiUrl(auth.base_url)}/is-connected`,
        headers: {
          Authorization: auth.api_key,
        },
      });
    } catch {
      return {
        valid: false,
        error: 'Invalid API key or base URL. Please check your credentials.',
      };
    }
    if (!isJwtMode({ authType: auth.authType, props: auth })) {
      return { valid: true };
    }
    if (!auth.email || !auth.password) {
      return {
        valid: false,
        error:
          'Email and Password are required for the API Key + Email & Password method.',
      };
    }
    try {
      await fetchSessionToken({
        baseUrl: auth.base_url,
        email: auth.email,
        password: auth.password,
      });
    } catch {
      return {
        valid: false,
        error:
          'Invalid Postiz email or password. Accounts signed up through Google or GitHub cannot use this method.',
      };
    }
    return { valid: true };
  },
});

export const postizAuthHelpers = {
  isJwtAuth: (auth: PostizAuthValue): boolean =>
    isJwtMode({ authType: auth.props.authType, props: auth.props }),
  publicApiUrl: (auth: PostizAuthValue): string =>
    publicApiUrl(auth.props.base_url),
  instanceApiUrl: (auth: PostizAuthValue): string =>
    instanceApiUrl(auth.props.base_url),
  login: async (auth: PostizAuthValue): Promise<string> => {
    if (!auth.props.email || !auth.props.password) {
      throw new Error(
        'Email and Password are missing from this Postiz connection. Reconnect with the API Key + Email & Password method.'
      );
    }
    return await fetchSessionToken({
      baseUrl: auth.props.base_url,
      email: auth.props.email,
      password: auth.props.password,
    });
  },
};

export type PostizAuthValue = AppConnectionValueForAuthProperty<
  typeof postizAuth
>;
