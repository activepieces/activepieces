import { createHash, createSign } from 'node:crypto';

import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';

export function normalizePrivateKey(value: string): string {
  const text = String(value ?? '')
    .trim()
    .replace(/^"|"$/g, '')
    .replace(/\\n/g, '\n');
  const match = PEM_SHAPE.exec(text);
  if (!match) {
    throw new Error(PEM_ERROR);
  }
  const [, label, rawBody] = match;
  const body = (rawBody ?? '').replace(/\s+/g, '');
  if (body.length === 0 || !/^[A-Za-z0-9+/=]+$/.test(body)) {
    throw new Error(PEM_ERROR);
  }
  const lines = body.match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----\n`;
}

export function buildAssertion({
  creds,
  scopes,
  now = Math.floor(Date.now() / 1000),
}: {
  creds: ServiceAccountCredentials;
  scopes: string[];
  now?: number;
}): string {
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64Url(
    JSON.stringify({
      iss: creds.clientEmail.trim(),
      sub: creds.adminEmail.trim(),
      scope: scopes.join(' '),
      aud: GOOGLE_TOKEN_URL,
      iat: now,
      exp: now + JWT_LIFETIME_SECONDS,
    })
  );
  const input = `${header}.${claims}`;
  let signature: string;
  try {
    signature = createSign('RSA-SHA256').update(input).end().sign(normalizePrivateKey(creds.privateKey), 'base64url');
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('The private key must be')) throw error;
    throw new Error(
      `The private key could not be read (${error instanceof Error ? error.message : String(error)}). Paste the whole private_key value of the service account key file.`
    );
  }
  return `${input}.${signature}`;
}

export async function mintServiceAccountToken({
  creds,
  scopes,
}: {
  creds: ServiceAccountCredentials;
  scopes: string[];
}): Promise<string> {
  const cacheKey = tokenCacheKey({ creds, scopes });
  const cached = tokenCache.get(cacheKey);
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.expiresAt - REFRESH_MARGIN_SECONDS > now) {
    return cached.accessToken;
  }

  let body: TokenResponse;
  try {
    const response = await httpClient.sendRequest<TokenResponse>({
      method: HttpMethod.POST,
      url: GOOGLE_TOKEN_URL,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: buildAssertion({ creds, scopes, now }),
      }).toString(),
    });
    body = response.body;
  } catch (error) {
    throw new Error(describeTokenError(error), { cause: error });
  }

  if (!body.access_token) {
    throw new Error(
      `Google token endpoint returned no access token${body.error ? ` (${body.error}: ${body.error_description ?? ''})` : ''}.`
    );
  }
  tokenCache.set(cacheKey, { accessToken: body.access_token, expiresAt: now + (body.expires_in ?? JWT_LIFETIME_SECONDS) });
  return body.access_token;
}

export function clearTokenCache(): void {
  tokenCache.clear();
}

export async function validateServiceAccount(
  creds: ServiceAccountCredentials
): Promise<{ valid: true } | { valid: false; error: string }> {
  const { GoogleWorkspaceApi } = await import('./client');
  const { googleWorkspaceScopes } = await import('../auth');
  try {
    const token = await mintServiceAccountToken({ creds, scopes: googleWorkspaceScopes });
    const user = await GoogleWorkspaceApi.request<{ isAdmin?: boolean; isDelegatedAdmin?: boolean; primaryEmail?: string }>({
      auth: { access_token: token },
      method: HttpMethod.GET,
      path: `admin/directory/v1/users/${encodeURIComponent(creds.adminEmail.trim())}`,
    });
    if (!user.isAdmin && !user.isDelegatedAdmin) {
      return {
        valid: false,
        error: `${user.primaryEmail ?? creds.adminEmail} is not a Workspace administrator; pick a user with an admin role.`,
      };
    }
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function tokenCacheKey({ creds, scopes }: { creds: ServiceAccountCredentials; scopes: string[] }): string {
  const keyHash = createHash('sha256').update(normalizePrivateKey(creds.privateKey)).digest('hex');
  return [creds.clientEmail.trim(), creds.adminEmail.trim(), keyHash, scopes.join(' ')].join('|');
}

function base64Url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

function describeTokenError(error: unknown): string {
  if (error instanceof HttpError) {
    const body = error.response.body;
    if (isTokenResponse(body)) {
      const hint =
        body.error === 'unauthorized_client'
          ? " Check that domain-wide delegation is authorized in the Admin console for this service account's client ID with exactly the scopes the connection lists."
          : body.error === 'invalid_grant'
            ? ' Check the administrator e-mail (it must exist in your domain) and the server clock.'
            : '';
      return `Google rejected the service account (${body.error ?? error.response.status}): ${body.error_description ?? ''}${hint}`.trim();
    }
    return `Google token endpoint returned ${error.response.status}.`;
  }
  return error instanceof Error ? error.message : String(error);
}

function isTokenResponse(value: unknown): value is TokenResponse {
  return typeof value === 'object' && value !== null;
}

const JWT_LIFETIME_SECONDS = 3600;
const REFRESH_MARGIN_SECONDS = 300;
const PEM_SHAPE = /-----BEGIN ([A-Z ]*PRIVATE KEY)-----([\s\S]*?)-----END \1-----/;
const PEM_ERROR =
  'The private key must be the PEM block from the service account key file (-----BEGIN PRIVATE KEY----- to -----END PRIVATE KEY-----).';
const tokenCache = new Map<string, CachedToken>();

export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

type TokenResponse = { access_token?: string; expires_in?: number; error?: string; error_description?: string };

type CachedToken = { accessToken: string; expiresAt: number };

export type ServiceAccountCredentials = {
  clientEmail: string;
  privateKey: string;
  adminEmail: string;
};
