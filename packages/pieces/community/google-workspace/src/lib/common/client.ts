import { createHash, createSign } from 'node:crypto';

import { HttpMethod } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/pieces-framework';

import type {
  GoogleWorkspaceAuthValue,
  GoogleWorkspaceErrorDetail,
  GoogleWorkspaceListPage,
  GoogleWorkspaceQuery,
  GoogleWorkspaceResolvedAuth,
  GoogleWorkspaceServiceAccount,
} from './types';

class GoogleWorkspaceApiError extends Error {
  readonly status: number;
  readonly googleStatus: string | undefined;
  readonly errors: GoogleWorkspaceErrorDetail[];

  constructor({ status, googleStatus, errors, summary }: GoogleWorkspaceApiErrorParams) {
    super(summary);
    this.name = 'GoogleWorkspaceApiError';
    this.status = status;
    this.googleStatus = googleStatus;
    this.errors = errors;
  }

  static fromResponse({ status, text }: { status: number; text: string }): GoogleWorkspaceApiError {
    const parsed = parseErrorBody(text);

    const errors: GoogleWorkspaceErrorDetail[] = (parsed.error?.errors ?? []).map((e) => ({
      reason: e.reason ?? 'unknown',
      message: e.message ?? '',
      ...(e.domain ? { domain: e.domain } : {}),
      ...(e.location ? { location: e.location } : {}),
    }));

    const googleStatus = parsed.error?.status;
    const head = `Google Workspace API returned ${status}${
      googleStatus ? ` (${googleStatus})` : ''
    }`;
    const detail =
      errors.length > 0
        ? errors
            .map((e) => `${e.reason}: ${e.message}${e.location ? ` [${e.location}]` : ''}`)
            .join('; ')
        : parsed.error?.message ?? rawBodySummary(safeJson(text));

    return new GoogleWorkspaceApiError({
      status,
      googleStatus,
      errors,
      summary: `${head}: ${detail}${hintFor({ status, errors })}`,
    });
  }

  hasReason(reason: string): boolean {
    return this.errors.some((e) => e.reason === reason);
  }
}

function baseUrl(): string {
  return GOOGLE_ADMIN_API_ROOT;
}

async function request<T>({
  auth,
  method,
  path,
  query,
  body,
  timeoutMs,
}: RequestParams & { auth: GoogleWorkspaceResolvedAuth }): Promise<T> {
  const response = await send({
    url: requestUrl({ path, query }),
    method,
    token: auth.access_token,
    body,
    timeoutMs,
  });
  if (!response.ok) {
    throw GoogleWorkspaceApiError.fromResponse({ status: response.status, text: response.text });
  }
  return parseSuccessBody<T>({ status: response.status, text: response.text });
}

async function listPage<T>({
  auth,
  path,
  itemsKey,
  query = {},
}: ListPageParams & { auth: GoogleWorkspaceResolvedAuth }): Promise<GoogleWorkspaceListPage<T>> {
  const body = await request<ListResponse<T>>({ auth, method: HttpMethod.GET, path, query });
  const rawItems = body[itemsKey];
  const items = Array.isArray(rawItems) ? rawItems : [];
  const rawToken = body['nextPageToken'];
  const nextPageToken = typeof rawToken === 'string' ? rawToken : undefined;
  return { items, ...(nextPageToken ? { nextPageToken } : {}) };
}

async function listAll<T>({
  auth,
  path,
  itemsKey,
  query = {},
  maxRows = 2000,
}: ListPageParams & { auth: GoogleWorkspaceResolvedAuth; maxRows?: number }): Promise<{
  items: T[];
  truncated: boolean;
}> {
  const items: T[] = [];
  let pageToken: string | undefined;
  do {
    const page = await listPage<T>({ auth, path, itemsKey, query: { ...query, pageToken } });
    for (const item of page.items) {
      if (items.length >= maxRows) {
        return { items, truncated: true };
      }
      items.push(item);
    }
    pageToken = page.nextPageToken;
    if (items.length >= maxRows) {
      return { items, truncated: Boolean(pageToken) };
    }
  } while (pageToken);
  return { items, truncated: false };
}

async function resolveAuth(
  auth: GoogleWorkspaceAuthValue | undefined,
): Promise<GoogleWorkspaceResolvedAuth> {
  if (!auth) {
    throw new Error('A Google Workspace connection is required.');
  }
  if (auth.type === AppConnectionType.CUSTOM_AUTH) {
    return { access_token: await mintServiceAccountToken({ creds: auth.props, scopes: SCOPES }) };
  }
  if (!auth.access_token) {
    throw new Error('The Google Workspace connection has no access token; reconnect it.');
  }
  return { access_token: auth.access_token };
}

function normalizePrivateKey(value: string): string {
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

function buildAssertion({
  creds,
  scopes,
  now = Math.floor(Date.now() / 1000),
}: {
  creds: GoogleWorkspaceServiceAccount;
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
    }),
  );
  const input = `${header}.${claims}`;
  let signature: string;
  try {
    signature = createSign('RSA-SHA256')
      .update(input)
      .end()
      .sign(normalizePrivateKey(creds.privateKey), 'base64url');
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('The private key must be')) throw error;
    throw new Error(
      `The private key could not be read (${
        error instanceof Error ? error.message : String(error)
      }). Paste the whole private_key value of the service account key file.`,
    );
  }
  return `${input}.${signature}`;
}

async function mintServiceAccountToken({
  creds,
  scopes,
}: {
  creds: GoogleWorkspaceServiceAccount;
  scopes: string[];
}): Promise<string> {
  const cacheKey = tokenCacheKey({ creds, scopes });
  const now = Math.floor(Date.now() / 1000);
  const cached = readCachedToken({ key: cacheKey, now });
  if (cached) {
    return cached;
  }

  const { status, body } = await requestToken(
    new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: buildAssertion({ creds, scopes, now }),
    }).toString(),
  );

  if (status < 200 || status >= 300) {
    throw new Error(describeTokenError({ status, body }));
  }
  if (!body.access_token) {
    throw new Error(
      `Google token endpoint returned no access token${
        body.error ? ` (${body.error}: ${body.error_description ?? ''})` : ''
      }.`,
    );
  }
  writeCachedToken({
    key: cacheKey,
    token: {
      accessToken: body.access_token,
      expiresAt: now + (body.expires_in ?? JWT_LIFETIME_SECONDS),
    },
    now,
  });
  return body.access_token;
}

function clearTokenCache(): void {
  tokenCache.clear();
}

function cachedTokenCount(): number {
  return tokenCache.size;
}

function hintFor({
  status,
  errors,
}: {
  status: number;
  errors: GoogleWorkspaceErrorDetail[];
}): string {
  const reasons = new Set(errors.map((e) => e.reason));
  if (status === 403 && reasons.has('accessNotConfigured')) {
    return ' Enable the Admin SDK API in the Google Cloud project that owns the OAuth client or service account.';
  }
  if (status === 403 && (reasons.has('forbidden') || reasons.has('insufficientPermissions'))) {
    return ' The connected account lacks the admin privilege or the OAuth scope for this call; reconnect granting every scope, or use an account with the right admin role.';
  }
  if (status === 404) {
    return ' Check the identifier: user and group keys are e-mails or ids, org units are paths, devices use their resource id.';
  }
  if (status === 409) {
    return ' A record with that key already exists.';
  }
  return '';
}

function rawBodySummary(body: unknown): string {
  if (typeof body !== 'string') return JSON.stringify(body ?? null);
  if (/^\s*<(!doctype|html)/i.test(body)) {
    const title = /<title>([^<]*)<\/title>/i.exec(body)?.[1]?.trim();
    const url = /<code>([^<]*)<\/code>/i.exec(body)?.[1]?.trim();
    return `${title ?? 'HTML error page'}${
      url ? ` for ${url}` : ''
    } (the request URL is malformed, usually an empty identifier).`;
  }
  return body.length > 500 ? `${body.slice(0, 500)}...` : body;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function parseErrorBody(text: string): GoogleErrorBody {
  const body = safeJson(text);
  if (
    typeof body !== 'object' ||
    body === null ||
    !('error' in body) ||
    typeof body.error !== 'object' ||
    body.error === null
  ) {
    return {};
  }
  const error: GoogleErrorPayload = body.error;
  return {
    error: {
      message: optionalString(error.message),
      status: optionalString(error.status),
      errors: Array.isArray(error.errors) ? error.errors.map(toGoogleErrorEntry) : undefined,
    },
  };
}

function toGoogleErrorEntry(entry: unknown): GoogleErrorEntry {
  if (typeof entry !== 'object' || entry === null) {
    return {};
  }
  const fields: GoogleErrorPayload = entry;
  return {
    domain: optionalString(fields.domain),
    reason: optionalString(fields.reason),
    message: optionalString(fields.message),
    location: optionalString(fields.location),
  };
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function requestUrl({
  path,
  query,
}: {
  path: string;
  query: GoogleWorkspaceQuery | undefined;
}): string {
  const url = new URL(`${GOOGLE_ADMIN_API_ROOT}/${path.replace(/^\//, '')}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function send({ url, method, token, body, timeoutMs }: SendParams): Promise<RawResponse> {
  const payload = body === undefined ? undefined : JSON.stringify(body);
  try {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...(payload === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(payload === undefined ? {} : { body: payload }),
      signal: AbortSignal.timeout(requestTimeout(timeoutMs)),
    });
    return { status: response.status, ok: response.ok, text: await response.text() };
  } catch (error) {
    const reason = error instanceof Error ? error.name : 'unknown error';
    throw new Error(`Could not reach the Google Workspace API (${reason}). Try again in a moment.`);
  }
}

function requestTimeout(timeoutMs: number | undefined): number {
  if (timeoutMs === undefined) return REQUEST_TIMEOUT_MS;
  return Math.min(REQUEST_TIMEOUT_MS, Math.max(1, Math.ceil(timeoutMs)));
}

function parseSuccessBody<T>({ status, text }: { status: number; text: string }): T {
  const source = text.trim() === '' ? EMPTY_JSON_BODY : text;
  try {
    return JSON.parse(source);
  } catch {
    throw new GoogleWorkspaceApiError({
      status,
      googleStatus: undefined,
      errors: [],
      summary: `Google Workspace API returned ${status} with a response that is not JSON.`,
    });
  }
}

function tokenCacheKey({
  creds,
  scopes,
}: {
  creds: GoogleWorkspaceServiceAccount;
  scopes: string[];
}): string {
  const keyHash = createHash('sha256').update(normalizePrivateKey(creds.privateKey)).digest('hex');
  return [creds.clientEmail.trim(), creds.adminEmail.trim(), keyHash, scopes.join(' ')].join('|');
}

function base64Url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

async function requestToken(form: string): Promise<{ status: number; body: TokenResponse }> {
  let response: Response;
  try {
    response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: form,
      signal: AbortSignal.timeout(TOKEN_REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const reason = error instanceof Error ? error.name : 'unknown error';
    throw new Error(
      `Could not reach the Google token endpoint (${reason}). Try again in a moment.`,
    );
  }
  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch {
    parsed = undefined;
  }
  return { status: response.status, body: toTokenResponse(parsed) };
}

function toTokenResponse(value: unknown): TokenResponse {
  if (typeof value !== 'object' || value === null) return {};
  const record: Record<string, unknown> = { ...value };
  return {
    access_token: stringField(record['access_token']),
    expires_in: typeof record['expires_in'] === 'number' ? record['expires_in'] : undefined,
    error: stringField(record['error']),
    error_description: stringField(record['error_description']),
  };
}

function stringField(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function describeTokenError({ status, body }: { status: number; body: TokenResponse }): string {
  if (!body.error) {
    return `Google token endpoint returned ${status}.`;
  }
  const hint =
    body.error === 'unauthorized_client'
      ? " Check that domain-wide delegation is authorized in the Admin console for this service account's client ID with exactly the scopes the connection lists."
      : body.error === 'invalid_grant'
      ? ' Check the administrator e-mail (it must exist in your domain) and the server clock.'
      : '';
  return `Google rejected the service account (${body.error}): ${
    body.error_description ?? ''
  }${hint}`.trim();
}

function readCachedToken({ key, now }: { key: string; now: number }): string | undefined {
  sweepExpiredTokens(now);
  return tokenCache.get(key)?.accessToken;
}

function writeCachedToken({
  key,
  token,
  now,
}: {
  key: string;
  token: CachedToken;
  now: number;
}): void {
  sweepExpiredTokens(now);
  tokenCache.delete(key);
  tokenCache.set(key, token);
  for (const oldest of tokenCache.keys()) {
    if (tokenCache.size <= MAX_CACHED_TOKENS) break;
    tokenCache.delete(oldest);
  }
}

function sweepExpiredTokens(now: number): void {
  for (const [key, token] of tokenCache) {
    if (token.expiresAt - REFRESH_MARGIN_SECONDS <= now) {
      tokenCache.delete(key);
    }
  }
}

const SCOPES = [
  'https://www.googleapis.com/auth/admin.directory.user',
  'https://www.googleapis.com/auth/admin.directory.group',
  'https://www.googleapis.com/auth/admin.directory.group.member',
  'https://www.googleapis.com/auth/admin.directory.orgunit',
  'https://www.googleapis.com/auth/admin.directory.device.mobile',
  'https://www.googleapis.com/auth/admin.directory.device.chromeos',
  'https://www.googleapis.com/auth/admin.directory.rolemanagement',
  'https://www.googleapis.com/auth/admin.directory.userschema.readonly',
  'https://www.googleapis.com/auth/admin.datatransfer',
  'https://www.googleapis.com/auth/admin.reports.audit.readonly',
];
const GOOGLE_ADMIN_API_ROOT = 'https://admin.googleapis.com';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REQUEST_TIMEOUT_MS = 60_000;
const EMPTY_JSON_BODY = '{}';
const JWT_LIFETIME_SECONDS = 3600;
const REFRESH_MARGIN_SECONDS = 300;
const TOKEN_REQUEST_TIMEOUT_MS = 30_000;
const MAX_CACHED_TOKENS = 100;
const PEM_SHAPE = /-----BEGIN ([A-Z ]*PRIVATE KEY)-----([\s\S]*?)-----END \1-----/;
const PEM_ERROR =
  'The private key must be the PEM block from the service account key file (-----BEGIN PRIVATE KEY----- to -----END PRIVATE KEY-----).';
const tokenCache = new Map<string, CachedToken>();

export const googleWorkspaceClient = {
  baseUrl,
  request,
  listPage,
  listAll,
  resolveAuth,
  mintServiceAccountToken,
  normalizePrivateKey,
  buildAssertion,
  clearTokenCache,
  cachedTokenCount,
  ApiError: GoogleWorkspaceApiError,
  scopes: SCOPES,
  tokenUrl: GOOGLE_TOKEN_URL,
};

type RequestParams = {
  method: HttpMethod;
  path: string;
  query?: GoogleWorkspaceQuery;
  body?: unknown;
  timeoutMs?: number;
};

type ListPageParams = { path: string; itemsKey: string; query?: GoogleWorkspaceQuery };

type SendParams = {
  url: string;
  method: HttpMethod;
  token: string;
  body: unknown;
  timeoutMs: number | undefined;
};

type RawResponse = { status: number; ok: boolean; text: string };

type GoogleErrorEntry = { domain?: string; reason?: string; message?: string; location?: string };

type GoogleErrorPayload = {
  message?: unknown;
  status?: unknown;
  errors?: unknown;
  domain?: unknown;
  reason?: unknown;
  location?: unknown;
};

type GoogleErrorBody = {
  error?: {
    message?: string;
    status?: string;
    errors?: GoogleErrorEntry[];
  };
};

type ListResponse<T> = Record<string, T[] | string | undefined>;

type GoogleWorkspaceApiErrorParams = {
  status: number;
  googleStatus: string | undefined;
  errors: GoogleWorkspaceErrorDetail[];
  summary: string;
};

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

type CachedToken = { accessToken: string; expiresAt: number };
