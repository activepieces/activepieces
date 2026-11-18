import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';

export const CLOSE_API_URL = 'https://api.close.com/api/v1';

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RATE_LIMIT_RETRIES = 2;
const MAX_RATE_LIMIT_WAIT_MS = 30_000;
const DEFAULT_RATE_LIMIT_WAIT_MS = 2_000;
const MAX_PAGE_SIZE = 100;
const ID_RE = /^[A-Za-z0-9_-]+$/;

export class CloseApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseBody: unknown,
  ) {
    super(message);
    this.name = 'CloseApiError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function keyOf(auth: CloseAuthInput): string {
  const raw = typeof auth === 'string' ? auth : isRecord(auth) ? auth['secret_text'] : undefined;
  const key = typeof raw === 'string' ? raw.trim() : '';
  if (key === '') throw new Error('The Close connection has no API key. Reconnect Close with an API key from Settings → Developer → API Keys.');
  return key;
}

function hintFor(status: number): string {
  if (status === 401) return ' The API key is invalid or revoked; reconnect Close.';
  if (status === 402) return ' Your Close plan does not include this feature or a plan limit was reached.';
  if (status === 403) return ' The API key user is not allowed to do this.';
  if (status === 404) return ' Check the ID you passed.';
  if (status === 429) return ' Close is rate limiting this API key; try again later.';
  return '';
}

function fieldErrorsText(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined;
  const parts = Object.entries(value).map(([field, err]) => `${field}: ${Array.isArray(err) ? err.join(', ') : typeof err === 'string' ? err : JSON.stringify(err)}`);
  return parts.length > 0 ? parts.join('; ') : undefined;
}

function messageOf(body: unknown): string | undefined {
  if (typeof body === 'string') return body.trim() === '' ? undefined : body.trim().slice(0, 300);
  if (!isRecord(body)) return undefined;
  const parts: string[] = [];
  const err = body['error'];
  if (typeof err === 'string' && err.trim()) parts.push(err.trim());
  else if (isRecord(err) && typeof err['message'] === 'string') parts.push(err['message']);
  const fieldErrors = fieldErrorsText(body['field-errors']);
  if (fieldErrors) parts.push(fieldErrors);
  const errors = body['errors'];
  if (Array.isArray(errors) && errors.length > 0) parts.push(errors.map((e) => (typeof e === 'string' ? e : JSON.stringify(e))).join('; '));
  if (parts.length === 0 && Object.keys(body).length > 0) parts.push(JSON.stringify(body).slice(0, 300));
  return parts.length > 0 ? parts.join(' — ') : undefined;
}

function toApiError({ status, body }: { status: number; body: unknown }): CloseApiError {
  const text = status >= 300 && status < 400 ? 'unexpected redirect' : messageOf(body) ?? 'request failed';
  return new CloseApiError(`Close API error (${status}): ${text.replace(/\.+$/, '')}.${hintFor(status)}`, status, body);
}

function failureOf(error: unknown): { status: number; body: unknown } | null {
  if (error === null || typeof error !== 'object') return null;
  const response = Reflect.get(error, 'response');
  if (!isRecord(response)) return null;
  const status = response['status'];
  return typeof status === 'number' ? { status, body: response['body'] } : null;
}

function rateLimitWaitMs(body: unknown): number {
  const candidates = [isRecord(body) ? body['rate_reset'] : undefined, isRecord(body) && isRecord(body['error']) ? body['error']['rate_reset'] : undefined];
  for (const c of candidates) {
    const seconds = typeof c === 'number' ? c : typeof c === 'string' ? Number(c) : NaN;
    if (Number.isFinite(seconds) && seconds >= 0) return Math.min(Math.ceil(seconds * 1000), MAX_RATE_LIMIT_WAIT_MS);
  }
  return DEFAULT_RATE_LIMIT_WAIT_MS;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function buildQuery(query?: CloseQuery): QueryParams {
  const qs: QueryParams = {};
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null) continue;
    qs[key] = Array.isArray(value) ? value.join(',') : String(value);
  }
  return qs;
}

function normalizePath(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(path)) {
    throw new Error('Close request paths must be relative to the Close API (start with a single "/").');
  }
  if (path.split(/[/?#]/).some((part) => part === '..' || part.toLowerCase() === '%2e%2e')) {
    throw new Error('Close request paths must not contain ".." segments.');
  }
  return path;
}

async function request<T = unknown>({ auth, method, path, query, body }: CloseRequest): Promise<T> {
  const apiKey = keyOf(auth);
  const url = `${CLOSE_API_URL}${normalizePath(path)}`;
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await httpClient.sendRequest<T>({
        method,
        url,
        authentication: { type: AuthenticationType.BASIC, username: apiKey, password: '' },
        headers: { accept: 'application/json', ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
        queryParams: buildQuery(query),
        body,
        timeout: REQUEST_TIMEOUT_MS,
        followRedirects: false,
      });
      if (response.status < 200 || response.status >= 300) throw toApiError({ status: response.status, body: response.body });
      return response.body;
    } catch (error) {
      if (error instanceof CloseApiError) throw error;
      const failure = failureOf(error);
      if (!failure) throw error;
      if (failure.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
        await sleep(rateLimitWaitMs(failure.body));
        continue;
      }
      throw toApiError(failure);
    }
  }
}

async function listPage<T = Record<string, unknown>>({ auth, path, query, limit, skip }: CloseListParams): Promise<ClosePage<T>> {
  const pageSize = clampLimit(limit);
  const offset = Math.max(0, Math.trunc(skip ?? 0));
  const body = await request<{ data?: T[]; has_more?: boolean }>({
    auth,
    method: HttpMethod.GET,
    path,
    query: { ...query, _limit: pageSize, _skip: offset },
  });
  const items = Array.isArray(body?.data) ? body.data : [];
  const hasMore = body?.has_more === true && items.length > 0;
  return { items, hasMore, nextSkip: hasMore ? offset + items.length : null };
}

async function listAll<T = Record<string, unknown>>({ auth, path, query, maxItems = 1000 }: Omit<CloseListParams, 'limit' | 'skip'> & { maxItems?: number }): Promise<{ items: T[]; truncated: boolean }> {
  const items: T[] = [];
  let skip = 0;
  for (;;) {
    const page = await listPage<T>({ auth, path, query, skip, limit: MAX_PAGE_SIZE });
    for (const item of page.items) {
      if (items.length >= maxItems) return { items, truncated: true };
      items.push(item);
    }
    if (!page.hasMore || page.nextSkip === null) return { items, truncated: false };
    if (items.length >= maxItems) return { items, truncated: true };
    skip = page.nextSkip;
  }
}

async function searchPage<T = Record<string, unknown>>({ auth, query, fields, sort, limit, cursor }: CloseSearchParams): Promise<CloseCursorPage<T>> {
  const body = await request<{ data?: T[]; cursor?: string | null }>({
    auth,
    method: HttpMethod.POST,
    path: '/data/search/',
    body: {
      query,
      _limit: clampLimit(limit),
      ...(cursor ? { cursor } : {}),
      ...(fields ? { _fields: fields } : {}),
      ...(sort ? { sort } : {}),
    },
  });
  const items = Array.isArray(body?.data) ? body.data : [];
  const next = typeof body?.cursor === 'string' && body.cursor !== '' ? body.cursor : null;
  return { items, hasMore: next !== null, nextCursor: next };
}

async function searchAll<T = Record<string, unknown>>({ maxItems = 1000, ...params }: Omit<CloseSearchParams, 'cursor' | 'limit'> & { maxItems?: number }): Promise<{ items: T[]; truncated: boolean }> {
  const items: T[] = [];
  let cursor: string | null = null;
  for (;;) {
    const page: CloseCursorPage<T> = await searchPage<T>({ ...params, limit: MAX_PAGE_SIZE, cursor: cursor ?? undefined });
    for (const item of page.items) {
      if (items.length >= maxItems) return { items, truncated: true };
      items.push(item);
    }
    if (!page.hasMore || page.items.length === 0) return { items, truncated: false };
    if (items.length >= maxItems) return { items, truncated: true };
    cursor = page.nextCursor;
  }
}

function clampLimit(limit: unknown): number {
  const n = typeof limit === 'string' ? Number(limit) : limit;
  if (typeof n !== 'number' || !Number.isFinite(n)) return MAX_PAGE_SIZE;
  return Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(n)));
}


function optionalText(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text === '' ? undefined : text;
}

function clearableText(value: unknown): string | undefined {
  if (typeof value === 'string') return value.trim();
  return optionalText(value);
}

function requiredText({ value, label }: { value: unknown; label: string }): string {
  const text = optionalText(value);
  if (text === undefined) throw new Error(`${label} is required.`);
  return text;
}

function closeId({ value, label, prefix }: { value: unknown; label: string; prefix?: string }): string {
  const text = requiredText({ value, label });
  if (!ID_RE.test(text) || (prefix !== undefined && !text.startsWith(`${prefix}_`))) {
    throw new Error(`${label} must be a Close ID${prefix ? ` starting with "${prefix}_"` : ''}, e.g. ${prefix ?? 'lead'}_abc123.`);
  }
  return text;
}

function optionalCloseId({ value, label, prefix }: { value: unknown; label: string; prefix?: string }): string | undefined {
  return optionalText(value) === undefined ? undefined : closeId({ value, label, prefix });
}

function parseInteger({ value, label, min, max }: { value: unknown; label: string; min: number; max: number }): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = typeof value === 'string' ? Number(value.trim()) : value;
  if (typeof parsed !== 'number' || !Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${label} must be a whole number from ${min} to ${max}.`);
  }
  return parsed;
}

function parseBoolean({ value, label }: { value: unknown; label: string }): boolean | undefined {
  const v = Array.isArray(value) && value.length === 1 ? value[0] : value;
  if (v === undefined || v === null || v === '') return undefined;
  if (v === true || v === 'true') return true;
  if (v === false || v === 'false') return false;
  throw new Error(`${label} must be true or false.`);
}

function isoDateTime({ value, label }: { value: unknown; label: string }): string | undefined {
  const text = optionalText(value);
  if (text === undefined) return undefined;
  const time = Date.parse(text);
  if (Number.isNaN(time)) throw new Error(`${label} must be an ISO 8601 date-time, e.g. 2026-10-18T12:00:00Z.`);
  return new Date(time).toISOString();
}

function isoDate({ value, label }: { value: unknown; label: string }): string | undefined {
  const text = optionalText(value);
  if (text === undefined) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text) && !Number.isNaN(Date.parse(`${text}T00:00:00Z`))) return text;
  const time = Date.parse(text);
  if (Number.isNaN(time)) throw new Error(`${label} must be a date like 2026-10-18 or an ISO 8601 date-time.`);
  return new Date(time).toISOString();
}

function plainObject({ value, label }: { value: unknown; label: string }): Record<string, unknown> | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error(`${label} must be a JSON object.`);
    }
  }
  if (!isRecord(parsed)) throw new Error(`${label} must be an object of key/value pairs.`);
  return parsed;
}

function customFieldsBody({ value, label = 'Custom Fields' }: { value: unknown; label?: string }): Record<string, unknown> {
  const obj = plainObject({ value, label }) ?? {};
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(obj)) {
    const id = key.startsWith('custom.') ? key.slice('custom.'.length) : key;
    if (!/^cf_[A-Za-z0-9]+$/.test(id)) throw new Error(`${label}: "${key}" is not a custom field ID (expected cf_...). Use List Custom Fields to find IDs.`);
    out[`custom.${id}`] = v;
  }
  return out;
}

function stringList({ value, label }: { value: unknown; label: string }): string[] | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : null;
  if (raw === null) throw new Error(`${label} must be a list of text values.`);
  const list = raw.map((v) => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '')).filter((v) => v !== '');
  return list;
}

function pathId(id: string): string {
  return encodeURIComponent(id);
}

export const closeClient = {
  request,
  listPage,
  listAll,
  searchPage,
  searchAll,
  keyOf,
  isRecord,
  toApiError,
  normalizePath,
  optionalText,
  clearableText,
  requiredText,
  closeId,
  optionalCloseId,
  parseInteger,
  parseBoolean,
  isoDateTime,
  isoDate,
  plainObject,
  customFieldsBody,
  stringList,
  pathId,
  MAX_PAGE_SIZE,
};


export type CloseApiCallParams = {
  accessToken: string;
  method: HttpMethod;
  resourceUri: string;
  query?: Record<string, string | number | string[] | undefined>;
  body?: unknown;
};

export async function closeApiCall<T = unknown>({ accessToken, method, resourceUri, query, body }: CloseApiCallParams): Promise<T> {
  return request<T>({ auth: accessToken, method, path: resourceUri, query, body });
}

export async function closePaginatedApiCall<T = Record<string, unknown>>({ accessToken, resourceUri, query }: CloseApiCallParams): Promise<T[]> {
  const { items } = await listAll<T>({ auth: accessToken, path: resourceUri, query, maxItems: 5000 });
  return items;
}


export type CloseAuthInput = string | { secret_text: string };

export type CloseQuery = Record<string, string | number | boolean | string[] | null | undefined>;

export type CloseRequest = {
  auth: CloseAuthInput;
  method: HttpMethod;
  path: string;
  query?: CloseQuery;
  body?: unknown;
};

export type CloseListParams = {
  auth: CloseAuthInput;
  path: string;
  query?: CloseQuery;
  limit?: number;
  skip?: number;
};

export type CloseSearchParams = {
  auth: CloseAuthInput;
  query: Record<string, unknown>;
  fields?: Record<string, string[]>;
  sort?: unknown[];
  limit?: number;
  cursor?: string;
};

export type ClosePage<T> = { items: T[]; hasMore: boolean; nextSkip: number | null };
export type CloseCursorPage<T> = { items: T[]; hasMore: boolean; nextCursor: string | null };
