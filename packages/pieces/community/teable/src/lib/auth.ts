import { AppConnectionType, PieceAuth, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpError,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { TEABLE_CLOUD_URL } from './common/constants';

const TEABLE_APP_PATH_SEGMENTS = ['base', 'space', 'dashboard', 'setting', 'developer', 'invite', 'auth'];

function normalizeBaseUrl(raw: string | undefined): string {
  if (raw === undefined || raw.trim().length === 0) {
    return TEABLE_CLOUD_URL;
  }
  const trimmed = raw.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(
      'Base URL must be a full URL including the scheme, e.g. https://teable.example.com.'
    );
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Base URL must use http or https.');
  }
  if (parsed.username !== '' || parsed.password !== '') {
    throw new Error('Base URL must not contain credentials.');
  }
  if (parsed.search !== '' || parsed.hash !== '') {
    throw new Error('Base URL must not contain a query string or fragment.');
  }
  const path = parsed.pathname.replace(/\/+$/, '').replace(/\/api$/, '').replace(/\/+$/, '');
  const firstSegment = path.split('/')[1] ?? '';
  if (path !== '' && !TEABLE_APP_PATH_SEGMENTS.includes(firstSegment)) {
    throw new Error(
      `Base URL must be the instance origin only, e.g. https://teable.example.com — remove the path "${path}".`
    );
  }
  return parsed.origin;
}

function getToken(auth: TeableAuthValue): string {
  if (auth.type === AppConnectionType.CUSTOM_AUTH) {
    return auth.props.token.trim();
  }
  return auth.access_token;
}

function getBaseUrl(auth: TeableAuthValue): string {
  if (auth.type === AppConnectionType.CUSTOM_AUTH) {
    return normalizeBaseUrl(auth.props.baseUrl);
  }
  return TEABLE_CLOUD_URL;
}

async function validateConnection({
  token,
  baseUrl,
}: {
  token: string;
  baseUrl?: string;
}): Promise<{ valid: true } | { valid: false; error: string }> {
  let origin: string;
  try {
    origin = normalizeBaseUrl(baseUrl);
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : String(e) };
  }
  try {
    await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${origin}/api/base/access/all`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: token.trim(),
      },
    });
    return { valid: true };
  } catch (e) {
    if (e instanceof HttpError && (e.response.status === 401 || e.response.status === 403)) {
      return {
        valid: false,
        error: 'Invalid credentials. Check your personal access token and its scopes.',
      };
    }
    return {
      valid: false,
      error: `Could not reach ${origin}: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

export const TeableAuth = [
  PieceAuth.OAuth2({
    description: 'Connect your Teable account using OAuth2 (Teable Cloud only).',
    authUrl: 'https://app.teable.ai/api/oauth/authorize',
    tokenUrl: 'https://app.teable.ai/api/oauth/access_token',
    required: true,
    scope: [
      'base|read',
      'base|read_all',
      'table|read',
      'table|create',
      'field|read',
      'field|create',
      'view|read',
      'record|read',
      'record|create',
      'record|update',
      'record|delete',
      'record|comment',
    ],
  }),
  PieceAuth.CustomAuth({
    displayName: 'Personal Access Token',
    description: `
Authenticate using a Teable Personal Access Token. Also use this option for self-hosted instances.

To obtain your token:
1. Log in to your Teable account.
2. Click your profile icon (top-right corner).
3. Go to **Settings** > **Personal Access Token**.
4. Click **New Token**, set a name and the required scopes.
5. Copy and save the generated token.
    `,
    required: true,
    props: {
      token: PieceAuth.SecretText({
        displayName: 'Personal Access Token',
        description: 'Your Teable personal access token.',
        required: true,
      }),
      baseUrl: Property.ShortText({
        displayName: 'Base URL',
        description:
          'Teable Cloud: https://app.teable.ai — for self-hosted, enter your instance origin, e.g. https://teable.example.com.',
        required: false,
      }),
    },
    validate: async ({ auth }) => {
      return validateConnection({ token: auth.token, baseUrl: auth.baseUrl });
    },
  }),
];

export const teableAuthUtil = {
  getToken,
  getBaseUrl,
  normalizeBaseUrl,
};

export type TeableAuthValue =
  | {
      type:
        | AppConnectionType.OAUTH2
        | AppConnectionType.CLOUD_OAUTH2
        | AppConnectionType.PLATFORM_OAUTH2;
      access_token: string;
    }
  | {
      type: AppConnectionType.CUSTOM_AUTH;
      props: { token: string; baseUrl?: string };
    };
