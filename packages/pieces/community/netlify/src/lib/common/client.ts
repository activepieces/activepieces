import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';

export const NETLIFY_API_BASE = 'https://api.netlify.com/api/v1';
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_PAGES = 50;
const PAGE_SIZE = 100;
let verifiedTlsAgent: Promise<unknown> | undefined;

export class NetlifyApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly responseBody: unknown) {
    super(message);
    this.name = 'NetlifyApiError';
  }
}

export type NetlifyAuthValue = unknown;

type QueryValue = string | number | boolean | undefined | null;

function withoutAuthHeaders(headers: Record<string, string> | undefined): Record<string, string> {
  return Object.fromEntries(Object.entries(headers ?? {}).filter(([key]) => !['authorization', 'host', 'cookie'].includes(key.toLowerCase())));
}

function apiPath(url: unknown): string {
  const text = typeof url === 'string' ? url.trim() : '';
  if (text === '') {
    throw new Error('URL is required.');
  }
  const base = new URL(`${NETLIFY_API_BASE}/`);
  const target = /^[a-z][a-z0-9+.-]*:/i.test(text) || text.startsWith('//') ? new URL(text) : new URL(text.replace(/^\/+/, ''), base);
  if (target.origin !== base.origin || target.username !== '' || target.password !== '' || !`${target.pathname}/`.startsWith(base.pathname)) {
    throw new Error(`URL must be a path under ${NETLIFY_API_BASE}, e.g. /sites.`);
  }
  if (target.pathname.split('/').some((part) => part === '..' || decodeURIComponent(part) === '..')) {
    throw new Error('URL must not contain "..".');
  }
  return `${target.pathname.slice(base.pathname.length - 1)}${target.search}`;
}

function verifiedTls(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
  return verifiedTlsAgent;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function tokenOf(auth: NetlifyAuthValue): string {
  const raw = isRecord(auth) ? auth['access_token'] : undefined;
  const token = typeof raw === 'string' ? raw.trim() : '';
  if (!token) {
    throw new Error('The Netlify connection has no access token. Reconnect your Netlify account.');
  }
  return token;
}

function segment({ value, label }: { value: unknown; label: string }): string {
  const text = typeof value === 'string' ? value.trim() : typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
  if (text === '' || text === '.' || text === '..') {
    throw new Error(`${label} is required.`);
  }
  return encodeURIComponent(text);
}

function buildQuery(query?: Record<string, QueryValue>): QueryParams {
  return Object.fromEntries(
    Object.entries(query ?? {})
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, String(value)]),
  );
}

function vendorMessage(body: unknown): string {
  if (isRecord(body)) {
    const message = body['message'] ?? body['error'];
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
  }
  if (typeof body === 'string' && body.trim()) {
    return body.trim().slice(0, 300);
  }
  return 'request failed';
}

function hintFor(status: number): string {
  if (status === 401) return ' Reconnect your Netlify account.';
  if (status === 403) return ' The connected Netlify user has no access to this resource.';
  if (status === 404) return ' Check the ID; the resource does not exist or is not visible to this account.';
  if (status === 429) return ' Netlify rate limit reached; try again later.';
  return '';
}

function failureOf(error: unknown): { status: number; body: unknown } | null {
  if (error === null || typeof error !== 'object') return null;
  const response = Reflect.get(error, 'response');
  if (!isRecord(response)) return null;
  const status = response['status'];
  return typeof status === 'number' ? { status, body: response['body'] } : null;
}

async function request<T = unknown>({
  auth,
  method,
  path,
  query,
  body,
  redactBody,
  extraHeaders,
  timeout,
}: {
  auth: NetlifyAuthValue;
  method: HttpMethod;
  path: string;
  query?: Record<string, QueryValue>;
  body?: Record<string, unknown> | Record<string, unknown>[];
  redactBody?: boolean;
  extraHeaders?: Record<string, string>;
  timeout?: number;
}): Promise<{ status: number; body: T }> {
  const hasBody = body !== undefined && method !== HttpMethod.GET && method !== HttpMethod.DELETE;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...withoutAuthHeaders(extraHeaders),
    Authorization: `Bearer ${tokenOf(auth)}`,
  };
  if (hasBody) headers['Content-Type'] = 'application/json';
  const dispatcher = await verifiedTls();
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${NETLIFY_API_BASE}${path}`,
      headers,
      queryParams: buildQuery(query),
      body: hasBody ? body : undefined,
      timeout: timeout ?? REQUEST_TIMEOUT_MS,
      followRedirects: false,
      redactBodyInErrors: redactBody === true,
    }, { dispatcher });
    if (response.status >= 300) {
      throw new NetlifyApiError(`Netlify API error (${response.status}): unexpected redirect.`, response.status, undefined);
    }
    return { status: response.status, body: response.body };
  } catch (error) {
    const failure = failureOf(error);
    if (!failure) throw error;
    throw toApiError({ status: failure.status, body: failure.body, redact: redactBody === true });
  }
}

function toApiError({ status, body, redact }: { status: number; body: unknown; redact: boolean }): NetlifyApiError {
  return new NetlifyApiError(`Netlify API error (${status}): ${vendorMessage(body)}.${hintFor(status)}`.replace('..', '.'), status, redact ? undefined : body);
}

async function listAll<T = Record<string, unknown>>({
  auth,
  path,
  query,
}: {
  auth: NetlifyAuthValue;
  path: string;
  query?: Record<string, QueryValue>;
}): Promise<{ items: T[]; truncated: boolean }> {
  const items: T[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const response = await request<T[]>({ auth, method: HttpMethod.GET, path, query: { ...query, page, per_page: PAGE_SIZE } });
    const batch = Array.isArray(response.body) ? response.body : [];
    items.push(...batch);
    if (batch.length < PAGE_SIZE) {
      return { items, truncated: false };
    }
  }
  return { items, truncated: true };
}

function pageSize({ value, label }: { value: unknown; label: string }): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 100) {
    throw new Error(`${label} must be a whole number from 1 to 100.`);
  }
  return number;
}

function pageNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw new Error('Page must be a whole number of 1 or more.');
  }
  return number;
}

export const netlifyClient = { request, listAll, segment, pageSize, pageNumber, isRecord, toApiError, apiPath };
