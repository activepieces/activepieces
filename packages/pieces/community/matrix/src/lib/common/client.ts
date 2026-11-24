import { httpClient, HttpMethod, HttpResponse, QueryParams } from '@activepieces/pieces-common';

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RATE_LIMIT_RETRIES = 2;
const MAX_RETRY_WAIT_MS = 30_000;
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]'];
let verifiedTlsAgent: Promise<unknown> | undefined;

export class MatrixApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errcode: string | undefined,
    public readonly responseBody: unknown,
  ) {
    super(message);
    this.name = 'MatrixApiError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeHomeserver(raw: unknown): string {
  const text = typeof raw === 'string' ? raw.trim() : '';
  if (!text) {
    throw new Error('The Matrix connection has no Home Server URL.');
  }
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`;
  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    throw new Error('The Home Server is not a valid URL. Use an address like https://matrix-client.matrix.org.');
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('The Home Server URL must start with https://.');
  }
  if (parsed.protocol === 'http:' && !LOCAL_HOSTS.includes(parsed.hostname)) {
    throw new Error('The Home Server URL must use https:// (http:// is only allowed for localhost).');
  }
  if (parsed.username || parsed.password) {
    throw new Error('The Home Server URL must not contain a username or password.');
  }
  if (parsed.hash.startsWith('#/')) {
    throw new Error(
      'The Home Server looks like a web app link (it contains #/). Use the homeserver address from Element > Settings > Help & About, e.g. https://matrix-client.matrix.org.',
    );
  }
  if (parsed.search || parsed.hash || text.includes('?') || text.includes('#')) {
    throw new Error('The Home Server URL must not contain a query string or fragment.');
  }
  const path = parsed.pathname.replace(/\/+$/, '');
  if (/(^|[/\\])\.\.?([/\\?#]|$)/.test(text.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '/')) || path.split('/').some((part) => part === '..' || part === '.')) {
    throw new Error('The Home Server URL must not contain relative path segments.');
  }
  return `${parsed.origin}${path}`;
}

function isSameOrigin({ url, baseUrl }: { url: string; baseUrl: string }): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.username || parsed.password) return false;
  const base = new URL(baseUrl);
  if (parsed.origin !== base.origin) return false;
  const basePath = base.pathname.replace(/\/+$/, '');
  if (basePath === '') return true;
  return parsed.pathname === basePath || parsed.pathname.startsWith(`${basePath}/`);
}

function accessTokenOf(auth: MatrixAuthValue): string {
  const token = typeof auth.access_token === 'string' ? auth.access_token.trim() : '';
  if (!token) {
    throw new Error('The Matrix connection has no Access Token.');
  }
  return token;
}

function hintFor({ status, errcode }: { status: number; errcode: string | undefined }): string {
  if (errcode === 'M_UNKNOWN_TOKEN' || status === 401) return ' The access token is invalid or was logged out; reconnect Matrix.';
  if (errcode === 'M_FORBIDDEN') return ' Check the room membership and power levels of this account and the target user.';
  if (errcode === 'M_NOT_FOUND' || status === 404) return ' Check the room, event or user ID.';
  if (errcode === 'M_LIMIT_EXCEEDED' || status === 429) return ' The homeserver is rate limiting this account; try again later.';
  if (errcode === 'M_UNRECOGNIZED') return ' The homeserver does not support this endpoint.';
  return '';
}

function toApiError({ status, body }: { status: number; body: unknown }): MatrixApiError {
  const errcode = isRecord(body) && typeof body['errcode'] === 'string' ? body['errcode'] : undefined;
  let text = 'request failed';
  if (status >= 300 && status < 400) text = 'unexpected redirect';
  else if (isRecord(body) && typeof body['error'] === 'string' && body['error'].trim()) text = body['error'].trim().replace(/\.+$/, '');
  else if (typeof body === 'string' && body.trim()) text = body.trim().slice(0, 300);
  const code = errcode ? ` ${errcode}` : '';
  return new MatrixApiError(`Matrix API error (${status}${code}): ${text}.${hintFor({ status, errcode })}`, status, errcode, body);
}

function verifiedTls(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
  return verifiedTlsAgent;
}

function failureOf(error: unknown): { status: number; body: unknown; headers: unknown } | null {
  if (error === null || typeof error !== 'object') return null;
  const response = Reflect.get(error, 'response');
  if (!isRecord(response)) return null;
  const status = response['status'];
  return typeof status === 'number' ? { status, body: response['body'], headers: response['headers'] } : null;
}

function retryWaitMs({ body, headers }: { body: unknown; headers: unknown }): number {
  let wait = 1000;
  if (isRecord(body) && typeof body['retry_after_ms'] === 'number') {
    wait = body['retry_after_ms'];
  } else if (isRecord(headers)) {
    const header = headers['retry-after'];
    const seconds = Number(Array.isArray(header) ? header[0] : header);
    if (Number.isFinite(seconds)) wait = seconds * 1000;
  }
  return Math.min(Math.max(wait, 0), MAX_RETRY_WAIT_MS);
}

function buildQuery(query?: Record<string, string | number | boolean | undefined>): QueryParams {
  return Object.fromEntries(
    Object.entries(query ?? {})
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)]),
  );
}

async function sendOnce({ baseUrl, token, method, path, query, body }: SendOnceParams): Promise<{ status: number; body: unknown; headers: unknown }> {
  const headers: Record<string, string> = { accept: 'application/json', authorization: `Bearer ${token}` };
  if (body !== undefined) headers['content-type'] = 'application/json';
  const dispatcher = await verifiedTls();
  try {
    const response: HttpResponse = await httpClient.sendRequest(
      {
        method,
        url: `${baseUrl}${path}`,
        headers,
        queryParams: buildQuery(query),
        body,
        timeout: REQUEST_TIMEOUT_MS,
        followRedirects: false,
      },
      { dispatcher },
    );
    return { status: response.status, body: response.body, headers: response.headers };
  } catch (error) {
    const failure = failureOf(error);
    if (!failure) throw error;
    return failure;
  }
}

async function request({ auth, method, path, query, body }: MatrixRequest): Promise<unknown> {
  const baseUrl = normalizeHomeserver(auth.base_url);
  const token = accessTokenOf(auth);
  for (let attempt = 0; ; attempt++) {
    const result = await sendOnce({ baseUrl, token, method, path, query, body });
    if (result.status >= 200 && result.status < 300) {
      return result.body;
    }
    if (result.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, retryWaitMs(result)));
      continue;
    }
    throw toApiError(result);
  }
}

function arrayOf(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringOr(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text === '' ? undefined : text;
}

function requiredText({ value, label }: { value: unknown; label: string }): string {
  const text = optionalText(value);
  if (text === undefined) throw new Error(`${label} is required.`);
  return text;
}

function messageText({ value, label }: { value: unknown; label: string }): string {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${label} is required.`);
  return value;
}

function isServerName(value: string): boolean {
  return /^(?:[A-Za-z0-9.-]+|\[[0-9A-Fa-f:.]+\])(:\d{1,5})?$/.test(value);
}

function parseLimit({ value, label, min, max, fallback }: { value: unknown; label: string; min: number; max: number; fallback: number }): number {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = typeof value === 'string' ? Number(value.trim()) : value;
  if (typeof parsed !== 'number' || !Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${label} must be a whole number from ${min} to ${max}.`);
  }
  return parsed;
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => (typeof item === 'string' ? item.split(',') : [])).map((item) => item.trim()).filter((item) => item !== '');
  }
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter((item) => item !== '');
  }
  return [];
}

export const matrixClient = {
  request,
  normalizeHomeserver,
  isSameOrigin,
  accessTokenOf,
  isRecord,
  arrayOf,
  stringOr,
  optionalText,
  requiredText,
  messageText,
  isServerName,
  parseLimit,
  stringList,
  retryWaitMs,
};

type SendOnceParams = {
  baseUrl: string;
  token: string;
  method: HttpMethod;
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};

export type MatrixAuthValue = {
  base_url: string;
  access_token: string;
};

export type MatrixRequest = {
  auth: MatrixAuthValue;
  method: HttpMethod;
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};
