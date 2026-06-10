import { AppConnectionType } from '@activepieces/shared';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import jwt from 'jsonwebtoken';
import type { githubAuth } from '../auth';

export const githubAuthHelpers = {
  getBearerToken: async (auth: GithubAuthValue): Promise<string> => {
    const a = auth as GithubAuth;
    if (isGithubAppAuth(a)) {
      return getInstallationToken(a.props);
    }
    return a.access_token;
  },
};

export function isAppAuth(auth: GithubAuthValue): boolean {
  return isGithubAppAuth(auth as GithubAuth);
}

export async function getAuthenticatedLogin(
  auth: GithubAuthValue
): Promise<string> {
  const a = auth as GithubAuth;
  if (isGithubAppAuth(a)) {
    const signedJwt = signGithubAppJwt({
      appId: a.props.appId,
      privateKey: a.props.privateKey,
    });
    const response = await httpClient.sendRequest<{ slug: string }>({
      method: HttpMethod.GET,
      url: 'https://api.github.com/app',
      headers: {
        Authorization: `Bearer ${signedJwt}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    return `${response.body.slug}[bot]`;
  }
  const response = await httpClient.sendRequest<{ login: string }>({
    method: HttpMethod.GET,
    url: 'https://api.github.com/user',
    headers: {
      Authorization: `Bearer ${a.access_token}`,
    },
  });
  return response.body.login;
}

export function signGithubAppJwt({
  appId,
  privateKey,
}: {
  appId: string;
  privateKey: string;
}): string {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      iat: nowSeconds - JWT_CLOCK_SKEW_SECONDS,
      exp: nowSeconds + JWT_LIFETIME_SECONDS,
      iss: appId,
    },
    normalizePemKey(privateKey),
    { algorithm: 'RS256' }
  );
}

function normalizePemKey(rawKey: string): string {
  const escapedNewlinesReplaced = rawKey.replace(/\\n/g, '\n').trim();
  if (escapedNewlinesReplaced.includes('\n')) {
    return escapedNewlinesReplaced;
  }
  const match = escapedNewlinesReplaced.match(
    /^(-----BEGIN [A-Z0-9 ]+-----)(.+?)(-----END [A-Z0-9 ]+-----)$/
  );
  if (!match) {
    return escapedNewlinesReplaced;
  }
  const [, header, body, footer] = match;
  const wrappedBody = body
    .replace(/\s+/g, '')
    .match(/.{1,64}/g)
    ?.join('\n');
  return `${header}\n${wrappedBody}\n${footer}`;
}

export async function exchangeAppJwtForInstallationToken({
  jwt,
  installationId,
}: {
  jwt: string;
  installationId: string;
}): Promise<{ token: string; expiresAt: number }> {
  const response = await httpClient.sendRequest<{
    token: string;
    expires_at: string;
  }>({
    method: HttpMethod.POST,
    url: `https://api.github.com/app/installations/${installationId}/access_tokens`,
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  return {
    token: response.body.token,
    expiresAt: new Date(response.body.expires_at).getTime(),
  };
}

function isGithubAppAuth(auth: GithubAuth): auth is GithubAppAuth {
  return auth.type === AppConnectionType.CUSTOM_AUTH;
}

async function getInstallationToken({
  appId,
  installationId,
  privateKey,
}: {
  appId: string;
  installationId: string;
  privateKey: string;
}): Promise<string> {
  const cacheKey = `${appId}:${installationId}`;
  const cached = installationTokenCache.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt - now > TOKEN_REFRESH_LEEWAY_MS) {
    return cached.token;
  }
  const signedJwt = signGithubAppJwt({ appId, privateKey });
  const { token, expiresAt } = await exchangeAppJwtForInstallationToken({
    jwt: signedJwt,
    installationId,
  });
  installationTokenCache.set(cacheKey, { token, expiresAt });
  return token;
}

const JWT_CLOCK_SKEW_SECONDS = 60;
const JWT_LIFETIME_SECONDS = 540;
const TOKEN_REFRESH_LEEWAY_MS = 60 * 1000;

const installationTokenCache = new Map<
  string,
  { token: string; expiresAt: number }
>();

export type GithubAuthValue = AppConnectionValueForAuthProperty<
  typeof githubAuth
>;

type GithubOAuth2Auth = {
  type:
    | AppConnectionType.OAUTH2
    | AppConnectionType.CLOUD_OAUTH2
    | AppConnectionType.PLATFORM_OAUTH2;
  access_token: string;
  data: Record<string, unknown>;
};

type GithubAppAuth = {
  type: AppConnectionType.CUSTOM_AUTH;
  props: {
    appId: string;
    installationId: string;
    privateKey: string;
  };
};

type GithubAuth = GithubOAuth2Auth | GithubAppAuth;
