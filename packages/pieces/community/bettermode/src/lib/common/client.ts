import { createHash } from 'node:crypto';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { Store, StoreScope } from '@activepieces/pieces-framework';

export class BettermodeApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly responseBody: unknown;

  constructor({
    message,
    status,
    code,
    responseBody,
  }: {
    message: string;
    status: number;
    code: string | null;
    responseBody: unknown;
  }) {
    super(message);
    this.name = 'BettermodeApiError';
    this.status = status;
    this.code = code;
    this.responseBody = responseBody;
  }
}

export class BettermodeLoginError extends Error {
  readonly stage: 'domain' | 'login';
  readonly apiError: BettermodeApiError;

  constructor({ stage, apiError }: { stage: 'domain' | 'login'; apiError: BettermodeApiError }) {
    super(
      stage === 'login' && isLoginLockout(apiError)
        ? 'Bettermode has temporarily blocked logins for this account after too many attempts. Wait 5 minutes and try again.'
        : `${stage === 'domain' ? 'Bettermode could not open the community domain' : 'Bettermode login failed'}. ${apiError.message}`
    );
    this.name = 'BettermodeLoginError';
    this.stage = stage;
    this.apiError = apiError;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function assertRegion(region: unknown): string {
  const match = BETTERMODE_REGIONS.find((option) => option.value === region);
  if (match === undefined) {
    throw new Error('Select the US or EU region in the Bettermode connection.');
  }
  return match.value;
}

export function normalizeDomain(domain: unknown): string {
  if (typeof domain !== 'string' || domain.trim().length === 0) {
    throw new Error('Enter your community domain, for example community.example.com.');
  }
  let host = domain.trim().toLowerCase();
  host = host.replace(/^[a-z][a-z0-9+.-]*:\/\//, '');
  host = host.split(/[/?#]/)[0];
  if (host.includes('@')) {
    throw new Error('The community domain must not contain "@". Enter only the host, for example community.example.com.');
  }
  host = host.replace(/:\d+$/, '').replace(/\.$/, '');
  if (!HOSTNAME_PATTERN.test(host)) {
    throw new Error(`"${domain}" is not a valid community domain. Enter only the host, for example community.example.com.`);
  }
  return host;
}

export async function graphqlRequest({
  region,
  token,
  query,
  variables,
}: {
  region: string;
  token: string | null;
  query: string;
  variables?: GraphqlVariables;
}): Promise<Record<string, unknown>> {
  const url = assertRegion(region);
  for (let attempt = 0; ; attempt++) {
    const outcome = await sendOnce({ url, token, query, variables: variables ?? {} });
    if (outcome.kind === 'data') {
      return outcome.data;
    }
    if (outcome.error.status === 429 && attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAYS_MS[attempt]);
      continue;
    }
    throw outcome.error;
  }
}

export async function loginWithPassword(
  credentials: BettermodeCredentials
): Promise<BettermodeSession> {
  const region = assertRegion(credentials.region);
  const domain = normalizeDomain(credentials.domain);
  const guest = await withStage({
    stage: 'domain',
    request: graphqlRequest({ region, token: null, query: GUEST_TOKEN_QUERY, variables: { domain } }),
  });
  const guestToken = readPath({ value: guest, path: ['tokens', 'accessToken'] });
  if (typeof guestToken !== 'string') {
    throw new Error('Bettermode did not return a guest token for this community domain.');
  }
  const login = await withStage({
    stage: 'login',
    request: graphqlRequest({
      region,
      token: guestToken,
      query: LOGIN_MUTATION,
      variables: {
        email: credentials.email.trim(),
        password: credentials.password,
      },
    }),
  });
  const token = readPath({ value: login, path: ['loginNetwork', 'accessToken'] });
  const memberId = readPath({ value: login, path: ['loginNetwork', 'member', 'id'] });
  const memberName = readPath({ value: login, path: ['loginNetwork', 'member', 'name'] });
  if (typeof token !== 'string' || typeof memberId !== 'string') {
    throw new Error('Bettermode login did not return an access token.');
  }
  return {
    region,
    token,
    memberId,
    memberName: typeof memberName === 'string' ? memberName : null,
  };
}

export function getSession(credentials: BettermodeCredentials): Promise<BettermodeSession> {
  const store = tokenStores.get(credentials);
  if (store === undefined) {
    return getProcessSession(credentials);
  }
  return getStoredSession({ credentials, store }).then((result) => result.session);
}

export function bindTokenStore({
  credentials,
  store,
}: {
  credentials: BettermodeCredentials;
  store: BettermodeTokenStore;
}): BettermodeCredentials {
  tokenStores.set(credentials, store);
  return credentials;
}

export function clearSessionCache(): void {
  sessionCache.clear();
}

export function isLoginLockout(error: BettermodeApiError): boolean {
  return error.code === '120' || /too many wrong attempts/i.test(error.message);
}

function getProcessSession(credentials: BettermodeCredentials): Promise<BettermodeSession> {
  const key = sessionKey(credentials);
  const cached = sessionCache.get(key);
  if (cached !== undefined && cached.expiresAt > Date.now()) {
    return cached.session;
  }
  for (const [staleKey, stale] of sessionCache) {
    if (stale.expiresAt <= Date.now()) {
      sessionCache.delete(staleKey);
    }
  }
  const session = loginWithPassword(credentials);
  const entry = { session, expiresAt: Date.now() + SESSION_TTL_MS };
  sessionCache.set(key, entry);
  session
    .then((value) => {
      entry.expiresAt = sessionExpiry({ token: value.token });
    })
    .catch(() => {
      if (sessionCache.get(key) === entry) {
        sessionCache.delete(key);
      }
    });
  return session;
}

async function getStoredSession({
  credentials,
  store,
}: {
  credentials: BettermodeCredentials;
  store: BettermodeTokenStore;
}): Promise<{ session: BettermodeSession; fromStore: boolean }> {
  const region = assertRegion(credentials.region);
  const key = storeKey(credentials);
  const stored = await readStoredToken({ store, key });
  if (stored !== null) {
    return {
      session: { region, token: stored.accessToken, memberId: stored.memberId, memberName: stored.memberName },
      fromStore: true,
    };
  }
  const session = await getProcessSession(credentials);
  const value: StoredToken = {
    accessToken: session.token,
    memberId: session.memberId,
    memberName: session.memberName,
    expiresAt: sessionExpiry({ token: session.token, ttlMs: STORE_TTL_MS }),
  };
  try {
    await store.put(key, value, StoreScope.PROJECT);
  } catch {
    return { session, fromStore: false };
  }
  return { session, fromStore: false };
}

async function readStoredToken({ store, key }: { store: BettermodeTokenStore; key: string }): Promise<StoredToken | null> {
  let value: unknown;
  try {
    value = await store.get(key, StoreScope.PROJECT);
  } catch {
    return null;
  }
  if (
    !isRecord(value) ||
    typeof value['accessToken'] !== 'string' ||
    typeof value['memberId'] !== 'string' ||
    typeof value['expiresAt'] !== 'number' ||
    value['expiresAt'] <= Date.now()
  ) {
    return null;
  }
  return {
    accessToken: value['accessToken'],
    memberId: value['memberId'],
    memberName: typeof value['memberName'] === 'string' ? value['memberName'] : null,
    expiresAt: value['expiresAt'],
  };
}

async function dropSession({ credentials }: { credentials: BettermodeCredentials }): Promise<void> {
  sessionCache.delete(sessionKey(credentials));
  const store = tokenStores.get(credentials);
  if (store === undefined) {
    return;
  }
  try {
    await store.delete(storeKey(credentials), StoreScope.PROJECT);
  } catch {
    return;
  }
}

function sessionKey(credentials: BettermodeCredentials): string {
  const passwordHash = createHash('sha256').update(String(credentials.password)).digest('hex');
  return JSON.stringify([credentials.region, credentials.domain, credentials.email, passwordHash]);
}

function storeKey(credentials: BettermodeCredentials): string {
  const digest = createHash('sha256')
    .update(
      JSON.stringify([
        credentials.region,
        String(credentials.domain).trim().toLowerCase(),
        String(credentials.email).trim().toLowerCase(),
        createHash('sha256').update(String(credentials.password)).digest('hex'),
      ])
    )
    .digest('hex');
  return `bettermode_token_${digest}`;
}

function sessionExpiry({ token, ttlMs = SESSION_TTL_MS }: { token: string; ttlMs?: number }): number {
  const fallback = Date.now() + SESSION_TTL_MS;
  const cap = Date.now() + ttlMs;
  const payload = token.split('.')[1];
  if (payload === undefined) {
    return fallback;
  }
  try {
    const exp: unknown = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))['exp'];
    if (typeof exp !== 'number') {
      return fallback;
    }
    return Math.min(cap, exp * 1000 - SESSION_EXPIRY_MARGIN_MS);
  } catch {
    return fallback;
  }
}

function isTokenRejected(error: unknown): boolean {
  return (
    error instanceof BettermodeApiError &&
    (error.status === 401 || /jwt expired|token (?:has )?expired|invalid token|unauthenticated/i.test(error.message))
  );
}

export async function bettermodeQuery({
  auth,
  query,
  variables,
}: {
  auth: BettermodeCredentials;
  query: string;
  variables?: GraphqlVariables;
}): Promise<Record<string, unknown>> {
  const store = tokenStores.get(auth);
  const first =
    store === undefined
      ? { session: await getProcessSession(auth), fromStore: true }
      : await getStoredSession({ credentials: auth, store });
  try {
    return await graphqlRequest({ region: first.session.region, token: first.session.token, query, variables });
  } catch (error) {
    if (!isTokenRejected(error) || !first.fromStore) {
      throw error;
    }
    await dropSession({ credentials: auth });
    const fresh = await getSession(auth);
    return graphqlRequest({ region: fresh.region, token: fresh.token, query, variables });
  }
}

export function readPath({ value, path }: { value: unknown; path: string[] }): unknown {
  let current: unknown = value;
  for (const key of path) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

async function sendOnce({
  url,
  token,
  query,
  variables,
}: {
  url: string;
  token: string | null;
  query: string;
  variables: GraphqlVariables;
}): Promise<{ kind: 'data'; data: Record<string, unknown> } | { kind: 'error'; error: BettermodeApiError }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token !== null) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  let body: unknown;
  try {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url,
      headers,
      body: { query, variables },
      timeout: REQUEST_TIMEOUT_MS,
      followRedirects: false,
      redactBodyInErrors: true,
    });
    body = response.body;
  } catch (error) {
    const httpResponse = readHttpErrorResponse(error);
    if (httpResponse === undefined) {
      throw error;
    }
    return {
      kind: 'error',
      error: buildHttpError({ status: httpResponse.status, responseBody: httpResponse.body }),
    };
  }
  const errors = readPath({ value: body, path: ['errors'] });
  if (Array.isArray(errors) && errors.length > 0) {
    return { kind: 'error', error: buildGraphqlError({ errors, responseBody: body }) };
  }
  const data = readPath({ value: body, path: ['data'] });
  if (!isRecord(data)) {
    return {
      kind: 'error',
      error: new BettermodeApiError({
        message: 'Bettermode returned a response without data.',
        status: 200,
        code: null,
        responseBody: body,
      }),
    };
  }
  return { kind: 'data', data };
}

function readHttpErrorResponse(error: unknown): { status: number; body: unknown } | undefined {
  if (!(error instanceof Error) && !isRecord(error)) {
    return undefined;
  }
  const response: unknown = Reflect.get(error, 'response');
  if (!isRecord(response) || typeof response['status'] !== 'number') {
    return undefined;
  }
  return { status: response['status'], body: response['body'] };
}

function buildHttpError({ status, responseBody }: { status: number; responseBody: unknown }): BettermodeApiError {
  const graphqlErrors = readPath({ value: responseBody, path: ['errors'] });
  if (Array.isArray(graphqlErrors) && graphqlErrors.length > 0 && status !== 401 && status !== 403 && status !== 429) {
    const error = buildGraphqlError({ errors: graphqlErrors, responseBody });
    return new BettermodeApiError({ message: error.message, status, code: error.code, responseBody });
  }
  const base =
    STATUS_MESSAGES[status] ??
    (status >= 500
      ? 'Bettermode returned a server error. Retry later'
      : status >= 300 && status < 400
        ? 'Bettermode answered with an unexpected redirect, which was not followed'
        : 'Bettermode request failed');
  return new BettermodeApiError({ message: `${base} (HTTP ${status}).`, status, code: null, responseBody });
}

function buildGraphqlError({ errors, responseBody }: { errors: unknown[]; responseBody: unknown }): BettermodeApiError {
  const first = errors[0];
  const message = isRecord(first) && typeof first['message'] === 'string' ? first['message'] : 'Unknown error';
  const rawCode = isRecord(first) ? (first['code'] ?? readPath({ value: first, path: ['extensions', 'code'] })) : undefined;
  const code = typeof rawCode === 'string' || typeof rawCode === 'number' ? String(rawCode) : null;
  const path = isRecord(first) && Array.isArray(first['path']) ? first['path'].join('.') : null;
  const details = [code === null ? null : `code ${code}`, path === null ? null : `at ${path}`]
    .filter((part): part is string => part !== null)
    .join(', ');
  const rateLimited = /rate limit|too many requests/i.test(message);
  return new BettermodeApiError({
    message: `Bettermode error${details.length > 0 ? ` (${details})` : ''}: ${message.slice(0, 300)}`,
    status: rateLimited ? 429 : 200,
    code,
    responseBody,
  });
}

async function withStage({
  stage,
  request,
}: {
  stage: 'domain' | 'login';
  request: Promise<Record<string, unknown>>;
}): Promise<Record<string, unknown>> {
  try {
    return await request;
  } catch (error) {
    if (error instanceof BettermodeApiError) {
      throw new BettermodeLoginError({ stage, apiError: error });
    }
    throw error;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const sessionCache = new Map<string, { session: Promise<BettermodeSession>; expiresAt: number }>();
const SESSION_TTL_MS = 30 * 60 * 1000;
const SESSION_EXPIRY_MARGIN_MS = 30 * 1000;
const STORE_TTL_MS = 12 * 60 * 60 * 1000;
const tokenStores = new WeakMap<BettermodeCredentials, BettermodeTokenStore>();

type StoredToken = { accessToken: string; memberId: string; memberName: string | null; expiresAt: number };

const HOSTNAME_PATTERN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

const MAX_RETRIES = 2;
const RETRY_DELAYS_MS = [2000, 4000];
const REQUEST_TIMEOUT_MS = 30000;

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Bettermode rejected the request as invalid',
  401: 'Bettermode rejected the login token. Re-connect the Bettermode connection',
  403: 'Bettermode refused the request: the connected member lacks permission. Re-connect with an admin account or check the member role',
  404: 'Bettermode endpoint not found. Check the region in the connection',
  429: 'Bettermode rate limit reached. Retry later',
};

const GUEST_TOKEN_QUERY = `query GetGuestToken($domain: String!) {
  tokens(networkDomain: $domain) {
    accessToken
  }
}`;

const LOGIN_MUTATION = `mutation Login($email: String!, $password: String!) {
  loginNetwork(input: { usernameOrEmail: $email, password: $password }) {
    accessToken
    member {
      id
      name
    }
  }
}`;

export function assertCustomCallUrl({ region, url }: { region: string; url: unknown }): void {
  const base = new URL(assertRegion(region));
  if (typeof url !== 'string' || url.trim().length === 0) {
    return;
  }
  const value = url.trim();
  if (!/^[a-z][a-z0-9+.-]*:/i.test(value) && !value.startsWith('//')) {
    if (value.split(/[/?#]/).includes('..')) {
      throw new Error('The URL must not contain "..".');
    }
    return;
  }
  let target: URL;
  try {
    target = new URL(value);
  } catch {
    throw new Error('The URL is not valid.');
  }
  if (target.protocol !== 'https:' || target.origin !== base.origin || target.username !== '' || target.password !== '') {
    throw new Error(`Custom API calls can only go to ${base.origin}, the region of this connection.`);
  }
}

export type BettermodeCredentials = {
  region: string;
  domain: string;
  email: string;
  password: string;
};

export type BettermodeSession = {
  region: string;
  token: string;
  memberId: string;
  memberName: string | null;
};

type GraphqlVariables = Record<string, unknown>;

export type BettermodeTokenStore = Pick<Store, 'get' | 'put' | 'delete'>;

export const BETTERMODE_REGIONS = [
  { label: 'US Region', value: 'https://api.bettermode.com' },
  { label: 'EU Region', value: 'https://api.bettermode.de' },
];
