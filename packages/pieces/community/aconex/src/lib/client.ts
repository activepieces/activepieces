import { createHash } from 'node:crypto';
import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { AconexAuthProps, assertAuthProps } from './auth-props';
import { AconexError, mapTransportError } from './errors';
import { logEvent } from './log';

export const ACONEX_API_ORIGIN = 'https://api.aconex.com';
export const ACONEX_API_BASE = 'https://api.aconex.com/api';
export const MAX_FILE_BYTES = 500 * 1024 * 1024;

const MAX_IN_FLIGHT = 4;
const RETRY_WAITS_MS = [200, 400, 800];
const CUSTOM_PATH = /^\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]+$/;

type CachedToken = { token: string; expiresAt: number };

type AconexRequest = {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  responseType?: 'arraybuffer' | 'json' | 'blob' | 'text' | 'stream';
  followRedirects?: boolean;
};

const cache = new Map<string, CachedToken>();
const inflight = new Map<string, Promise<string>>();
const waiters: Array<() => void> = [];

let clock = (): number => Date.now();
let sleepFn = defaultSleep;
let minGapMs = 200;
let fileByteCap = MAX_FILE_BYTES;
let active = 0;
let nextStartAt = 0;
let drainTimer: ReturnType<typeof setTimeout> | undefined;

export function resetAconexForTests(): void {
  cache.clear();
  inflight.clear();
  waiters.length = 0;
  active = 0;
  nextStartAt = 0;
  if (drainTimer) {
    clearTimeout(drainTimer);
    drainTimer = undefined;
  }
  clock = () => Date.now();
  sleepFn = defaultSleep;
  minGapMs = 200;
  fileByteCap = MAX_FILE_BYTES;
}

export function setAconexClockForTests(fn: () => number): void {
  clock = fn;
}

export function aconexNow(): number {
  return clock();
}

export function setAconexThrottleForTests(options: {
  minGapMs?: number;
  sleep?: (ms: number) => Promise<void>;
}): void {
  if (options.minGapMs !== undefined) {
    minGapMs = options.minGapMs;
  }
  if (options.sleep) {
    sleepFn = options.sleep;
  }
}

export function setMaxFileBytesForTests(bytes: number): void {
  fileByteCap = bytes;
}

export function currentFileByteCap(): number {
  return fileByteCap;
}

export function getAccessToken(authInput: AconexAuthProps): Promise<string> {
  const auth = assertAuthProps(authInput);
  const key = cacheKey(auth);
  const hit = cache.get(key);
  if (hit && hit.expiresAt - 60_000 > clock()) {
    return Promise.resolve(hit.token);
  }
  const existing = inflight.get(key);
  if (existing) {
    return existing;
  }
  // Register the in-flight promise before mint's first await.
  let settle!: (token: string) => void;
  let fail!: (error: unknown) => void;
  const pending = new Promise<string>((resolve, reject) => {
    settle = resolve;
    fail = reject;
  });
  inflight.set(key, pending);
  mint(auth)
    .then(settle, fail)
    .finally(() => {
      if (inflight.get(key) === pending) {
        inflight.delete(key);
      }
    });
  return pending;
}

async function mint(auth: AconexAuthProps): Promise<string> {
  const body: Record<string, string> = { grant_type: 'client_credentials' };
  if (auth.userId && auth.userSite) {
    body['user_id'] = auth.userId;
    body['user_site'] = auth.userSite;
  }
  const started = Date.now();
  try {
    const response = await httpClient.sendRequest<{ access_token?: unknown; expires_in?: unknown }>({
      method: HttpMethod.POST,
      url: `${auth.lobby}/auth/token`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${auth.clientId}:${auth.clientSecret}`, 'utf8').toString('base64')}`,
      },
      body,
      timeout: 15_000,
      retries: 0,
      followRedirects: false,
    });
    const token = typeof response.body?.access_token === 'string' ? response.body.access_token : '';
    if (!token) {
      throw new AconexError('TOKEN_FAILED', 'Lobby returned no access_token.');
    }
    const expiresIn = expiresInSeconds(response.body?.expires_in);
    cache.set(cacheKey(auth), { token, expiresAt: clock() + expiresIn * 1000 });
    logEvent('aconex.token_mint', { result: 'success', durationMs: Date.now() - started });
    return token;
  } catch (error) {
    const mapped = mapTransportError(error);
    logEvent('aconex.token_mint', { result: 'error', errorCode: mapped.code, durationMs: Date.now() - started });
    throw mapped;
  }
}

export async function sendAconex(
  request: AconexRequest,
): Promise<{ status: number; headers: Record<string, string | string[] | undefined>; body: unknown }> {
  assertAconexUrl(request.url);
  assertNoCredentialQuery(request.queryParams);
  const followRedirects = request.followRedirects === true;
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    const started = Date.now();
    try {
      const response = await withThrottle(() =>
        httpClient.sendRequest({
          ...request,
          retries: 0,
          followRedirects,
        }),
      );
      logRequest(request, response.status, attempt + 1, Date.now() - started);
      return { status: response.status, headers: response.headers ?? {}, body: response.body };
    } catch (error) {
      lastError = error;
      if (attempt < 3 && isThrottleError(error)) {
        const waitMs = RETRY_WAITS_MS[attempt] ?? 800;
        logEvent('aconex.throttle', {
          pathTemplate: pathTemplate(request.url),
          attempt: attempt + 1,
          waitMs,
          errorCode: throttleCode(error),
        });
        await sleepFn(waitMs);
        continue;
      }
      const mapped = mapTransportError(error);
      logRequest(request, error instanceof HttpError ? error.response.status : 0, attempt + 1, Date.now() - started, mapped.code);
      throw mapped;
    }
  }
  throw mapTransportError(lastError);
}

export function assertSafeApiPath(path: string): void {
  if (typeof path !== 'string' || path.length === 0 || path.length > 2048) {
    throw new AconexError('UNSAFE_PATH', 'The path must be a relative Aconex API path.');
  }
  const decoded = safeDecode(path);
  if (
    path.includes('://') ||
    decoded.includes('://') ||
    path.startsWith('//') ||
    decoded.startsWith('//') ||
    path.includes('..') ||
    decoded.includes('..')
  ) {
    throw new AconexError(
      'UNSAFE_PATH',
      'The path must stay on the Aconex API. Absolute URLs, protocol-relative paths, and parent segments are not allowed.',
    );
  }
  if (!CUSTOM_PATH.test(path)) {
    throw new AconexError('UNSAFE_PATH', 'The path contains characters the Aconex API call does not allow.');
  }
}

export function assertProjectsPath(path: string): void {
  assertSafeApiPath(path);
  if (path !== '/projects' && !path.startsWith('/projects/')) {
    throw new AconexError('UNSAFE_PATH', 'This action only calls project API paths.');
  }
}

function cacheKey(auth: AconexAuthProps): string {
  return createHash('sha256')
    .update(JSON.stringify([auth.lobby, auth.clientId, auth.userId ?? '', auth.userSite ?? '']))
    .digest('hex');
}

function expiresInSeconds(value: unknown): number {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 3600;
  }
  return parsed;
}

function assertAconexUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new AconexError('UNSAFE_URL', 'The Aconex URL is invalid.');
  }
  const onApi = parsed.pathname === '/api' || parsed.pathname.startsWith('/api/');
  if (parsed.origin !== ACONEX_API_ORIGIN || !onApi) {
    throw new AconexError('UNSAFE_URL', 'Aconex data calls must use https://api.aconex.com/api.');
  }
}

function assertNoCredentialQuery(query: Record<string, string> | undefined): void {
  if (!query) {
    return;
  }
  for (const key of Object.keys(query)) {
    const lower = key.toLowerCase();
    if (lower === 'username' || lower === 'password') {
      throw new AconexError('UNSAFE_QUERY', 'Aconex requests do not send username or password query parameters.');
    }
  }
}

function safeDecode(path: string): string {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

function isThrottleError(error: unknown): boolean {
  if (!(error instanceof HttpError)) {
    return false;
  }
  if (error.response.status === 429) {
    return true;
  }
  if (error.response.status !== 503) {
    return false;
  }
  const body = typeof error.response.body === 'string' ? error.response.body : JSON.stringify(error.response.body ?? '');
  return body.includes('CONCURRENCY_THROTTLE_LIMIT_REACHED') || body.includes('MAX_FREQUENCY_THROTTLE_LIMIT_REACHED');
}

function throttleCode(error: unknown): string {
  if (!(error instanceof HttpError)) {
    return 'THROTTLE';
  }
  const body = typeof error.response.body === 'string' ? error.response.body : '';
  if (body.includes('CONCURRENCY_THROTTLE_LIMIT_REACHED')) {
    return 'CONCURRENCY_THROTTLE_LIMIT_REACHED';
  }
  if (body.includes('MAX_FREQUENCY_THROTTLE_LIMIT_REACHED')) {
    return 'MAX_FREQUENCY_THROTTLE_LIMIT_REACHED';
  }
  return error.response.status === 429 ? '429' : 'THROTTLE';
}

function logRequest(
  request: AconexRequest,
  status: number,
  attempt: number,
  durationMs: number,
  errorCode?: string,
): void {
  const template = pathTemplate(request.url);
  const mailRead = /\/mail\/:id$/.test(template);
  if (mailRead && status >= 200 && status < 300) {
    logEvent('aconex.request', { method: request.method, pathTemplate: template, status });
    return;
  }
  logEvent('aconex.request', {
    method: request.method,
    pathTemplate: template,
    status,
    attempt,
    durationMs,
    errorCode,
  });
}

function pathTemplate(url: string): string {
  try {
    return new URL(url).pathname.replace(/\/[0-9]+/g, '/:id');
  } catch {
    return 'invalid-url';
  }
}

// Per process only. Two workers can still exceed Oracle's 5 requests/second org limit.
async function withThrottle<T>(fn: () => Promise<T>): Promise<T> {
  await acquireSlot();
  try {
    return await fn();
  } finally {
    releaseSlot();
  }
}

function acquireSlot(): Promise<void> {
  return new Promise((resolve) => {
    waiters.push(resolve);
    scheduleDrain(0);
  });
}

function releaseSlot(): void {
  active = Math.max(0, active - 1);
  drain();
}

function scheduleDrain(delay: number): void {
  if (drainTimer) {
    return;
  }
  drainTimer = setTimeout(() => {
    drainTimer = undefined;
    drain();
  }, delay);
}

function drain(): void {
  if (waiters.length === 0 || active >= MAX_IN_FLIGHT) {
    return;
  }
  const wait = Math.max(0, nextStartAt - Date.now());
  if (wait > 0) {
    scheduleDrain(wait);
    return;
  }
  const resolve = waiters.shift();
  if (!resolve) {
    return;
  }
  active += 1;
  nextStartAt = Date.now() + minGapMs;
  resolve();
  if (waiters.length > 0 && active < MAX_IN_FLIGHT) {
    scheduleDrain(minGapMs);
  }
}

async function defaultSleep(ms: number): Promise<void> {
  const jittered = Math.floor(Math.random() * ms);
  await new Promise((resolve) => setTimeout(resolve, jittered));
}
