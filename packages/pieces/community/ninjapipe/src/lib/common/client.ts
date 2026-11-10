import { AuthenticationType, HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';

const MAX_PAGE_SIZE = 100;
const RETURN_ALL_MAX_ITEMS = 5000;
const MAX_RATE_LIMIT_RETRIES = 2;
const MAX_RETRY_WAIT_SECONDS = 60;
const DEFAULT_RETRY_WAIT_SECONDS = 10;
const MAX_ERROR_BODY_CHARS = 2000;
const KEEP_EMPTY_QUERY_KEYS = ['parent_id'];


export class NinjaPipeApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly responseBody: unknown;

  constructor({ message, status, code, responseBody }: { message: string; status: number; code?: string; responseBody: unknown }) {
    super(message);
    this.name = 'NinjaPipeApiError';
    this.status = status;
    this.code = code;
    this.responseBody = responseBody;
  }
}

function isRecord(value: unknown): value is NinjaPipeRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function readAuth(auth: unknown): NinjaPipeAuth {
  const source = isRecord(auth) && isRecord(auth['props']) ? auth['props'] : auth;
  const baseUrl = isRecord(source) ? readString(source['base_url']) : undefined;
  const apiKey = isRecord(source) ? readString(source['api_key']) : undefined;
  if (!baseUrl || !apiKey) {
    throw new Error('The NinjaPipe connection is missing the API Base URL or API Key. Reconnect the account.');
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ''), apiKey };
}

function pathId({ value, field }: { value: unknown; field: string }): string {
  const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : '';
  if (text.length === 0) throw new Error(`${field} is required.`);
  return encodeURIComponent(text);
}

function clampLimit({ value, fallback = 20 }: { value: unknown; fallback?: number }): number {
  const parsed = readNumber(value);
  if (parsed === undefined) return fallback;
  return Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(parsed)));
}

function readPage(value: unknown): number {
  const parsed = readNumber(value);
  if (parsed === undefined) return 1;
  return Math.max(1, Math.floor(parsed));
}

function boundedBody(body: unknown): unknown {
  const serialized = typeof body === 'string' ? body : JSON.stringify(body ?? null);
  return serialized.length > MAX_ERROR_BODY_CHARS ? `${serialized.slice(0, MAX_ERROR_BODY_CHARS)}…` : body;
}

function describeBody(body: unknown): { message: string | undefined; code: string | undefined } {
  if (isRecord(body)) {
    const details = isRecord(body['details']) ? body['details'] : undefined;
    const fields = details && Array.isArray(details['fields']) ? details['fields'].map(String) : [];
    const base = readString(body['message']) ?? readString(body['error']);
    const message = base && fields.length > 0 && !base.includes(fields[0]) ? `${base} (${fields.join(', ')})` : base;
    return { message, code: readString(body['code']) };
  }
  if (typeof body === 'string' && /<html/i.test(body)) {
    return { message: 'endpoint not found on this NinjaPipe API', code: undefined };
  }
  return { message: readString(body), code: undefined };
}

function hint(status: number): string {
  if (status === 401) return ' The API key was rejected; check it in NinjaPipe Workspace Settings > NinjaPipe API.';
  if (status === 403) return ' The API key is not allowed to do this; create and update steps need a key with write permission.';
  if (status === 404) return ' Check that the ID exists in this workspace.';
  if (status === 429) return ' NinjaPipe allows 100 requests per minute per API key; space out the steps.';
  return '';
}

function toNinjaPipeError({ status, body, operation }: { status: number; body: unknown; operation: string }): NinjaPipeApiError {
  const { message, code } = describeBody(body);
  return new NinjaPipeApiError({
    message: `NinjaPipe ${operation} failed (HTTP ${status})${message ? `: ${message.replace(/\.+$/, '')}` : ''}.${hint(status)}`,
    status,
    code,
    responseBody: boundedBody(body),
  });
}

function readHttpFailure(error: unknown): { status: number; body: unknown; headers: Record<string, unknown> } | undefined {
  if (!isRecord(error) || !isRecord(error['response'])) return undefined;
  const response = error['response'];
  const status = readNumber(response['status']);
  if (status === undefined) return undefined;
  return { status, body: response['body'], headers: isRecord(response['headers']) ? response['headers'] : {} };
}

function retryAfterSeconds({ body, headers }: { body: unknown; headers: Record<string, unknown> }): number {
  const fromBody = isRecord(body) ? readNumber(body['retryAfter']) : undefined;
  const fromHeader = readNumber(headers['retry-after']);
  const seconds = fromBody ?? fromHeader ?? DEFAULT_RETRY_WAIT_SECONDS;
  return Math.min(MAX_RETRY_WAIT_SECONDS, Math.max(1, seconds));
}


function cleanQuery(query: Record<string, unknown> | undefined): Record<string, string> | undefined {
  if (!query) return undefined;
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || (value === '' && !KEEP_EMPTY_QUERY_KEYS.includes(key))) continue;
    result[key] = String(value);
  }
  return result;
}

async function ninjapipeRequest<T = unknown>({
  auth,
  method,
  path,
  body,
  query,
  operation,
}: {
  auth: NinjaPipeAuth;
  method: HttpMethod;
  path: string;
  body?: unknown;
  query?: Record<string, unknown>;
  operation: string;
}): Promise<T> {
  if (!path.startsWith('/') || path.startsWith('//')) {
    throw new Error(`Invalid NinjaPipe API path "${path}".`);
  }
  const request: HttpRequest = {
    method,
    url: `${auth.baseUrl}${path}`,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.apiKey },
    headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
    body,
    queryParams: cleanQuery(query),
  };
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await httpClient.sendRequest<T>(request);
      return response.body;
    } catch (error) {
      const failure = readHttpFailure(error);
      if (!failure) throw error;
      if (failure.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
        await ninjapipeClock.wait(retryAfterSeconds(failure) * 1000);
        continue;
      }
      throw toNinjaPipeError({ status: failure.status, body: failure.body, operation });
    }
  }
}

function unwrapRecord(body: unknown): NinjaPipeRecord {
  if (isRecord(body) && isRecord(body['data'])) return body['data'];
  if (isRecord(body)) return body;
  return {};
}

async function getRecord({ auth, path, operation }: { auth: NinjaPipeAuth; path: string; operation: string }): Promise<NinjaPipeRecord> {
  return unwrapRecord(await ninjapipeRequest({ auth, method: HttpMethod.GET, path, operation }));
}

async function sendRecord({
  auth,
  method,
  path,
  body,
  operation,
}: {
  auth: NinjaPipeAuth;
  method: HttpMethod;
  path: string;
  body: NinjaPipeRecord;
  operation: string;
}): Promise<NinjaPipeRecord> {
  return unwrapRecord(await ninjapipeRequest({ auth, method, path, body, operation }));
}

async function deleteRecord({
  auth,
  path,
  id,
  operation,
}: {
  auth: NinjaPipeAuth;
  path: string;
  id: string;
  operation: string;
}): Promise<{ deleted: boolean; id: string; name: string | null; message: string | null }> {
  const body = await ninjapipeRequest({ auth, method: HttpMethod.DELETE, path, operation });
  const data = isRecord(body) && isRecord(body['data']) ? body['data'] : {};
  const name = readString(data['name']) ?? readString(data['title']) ?? null;
  return {
    deleted: true,
    id: readString(data['id']) ?? id,
    name,
    message: isRecord(body) ? readString(body['message']) ?? null : null,
  };
}

function readItems(body: unknown): NinjaPipeRecord[] {
  const data = Array.isArray(body) ? body : isRecord(body) && Array.isArray(body['data']) ? body['data'] : [];
  return data.filter(isRecord);
}

function readPagination({ body, page, limit, itemCount }: { body: unknown; page: number; limit: number; itemCount: number }): { total: number | null; hasMore: boolean } {
  const pagination = isRecord(body) && isRecord(body['pagination']) ? body['pagination'] : undefined;
  const total = pagination ? readNumber(pagination['total']) ?? null : null;
  const pages = pagination ? readNumber(pagination['pages']) ?? readNumber(pagination['totalPages']) : undefined;
  if (pages !== undefined && pages > 0) return { total, hasMore: page < pages };
  if (total !== null && total > 0) return { total, hasMore: page * limit < total };
  return { total, hasMore: itemCount === limit };
}

async function listPage({
  auth,
  path,
  query,
  page,
  limit,
  operation,
}: {
  auth: NinjaPipeAuth;
  path: string;
  query?: Record<string, unknown>;
  page: number;
  limit: number;
  operation: string;
}): Promise<NinjaPipePage> {
  const body = await ninjapipeRequest({ auth, method: HttpMethod.GET, path, query: { ...query, page, limit }, operation });
  const items = readItems(body);
  const pagination = readPagination({ body, page, limit, itemCount: items.length });
  const hasMore = pagination.hasMore;
  const total = page === 1 && !hasMore ? items.length : pagination.total;
  return { items, count: items.length, total, hasMore, nextPage: hasMore ? page + 1 : null };
}

async function listAll({
  auth,
  path,
  query,
  operation,
  maxItems = RETURN_ALL_MAX_ITEMS,
}: {
  auth: NinjaPipeAuth;
  path: string;
  query?: Record<string, unknown>;
  operation: string;
  maxItems?: number;
}): Promise<NinjaPipePage> {
  const items: NinjaPipeRecord[] = [];
  let page = 1;
  let total: number | null = null;
  let hasMore = true;
  while (hasMore && items.length < maxItems) {
    const result = await listPage({ auth, path, query, page, limit: MAX_PAGE_SIZE, operation });
    total = result.total;
    items.push(...result.items.slice(0, maxItems - items.length));
    hasMore = result.hasMore && result.items.length > 0;
    page += 1;
  }
  const truncated = hasMore;
  return { items, count: items.length, total, hasMore: truncated, nextPage: truncated ? page : null };
}

async function runList({
  auth,
  path,
  query,
  operation,
  returnAll,
  page,
  limit,
}: {
  auth: NinjaPipeAuth;
  path: string;
  query?: Record<string, unknown>;
  operation: string;
  returnAll: unknown;
  page: unknown;
  limit: unknown;
}): Promise<NinjaPipePage> {
  if (returnAll === true) return listAll({ auth, path, query, operation });
  return listPage({ auth, path, query, page: readPage(page), limit: clampLimit({ value: limit }), operation });
}

export const ninjapipeClock = {
  wait: (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
};

export const ninjapipeClient = {
  isRecord,
  readAuth,
  pathId,
  clampLimit,
  readPage,
  toNinjaPipeError,
  retryAfterSeconds,
  ninjapipeRequest,
  unwrapRecord,
  getRecord,
  sendRecord,
  deleteRecord,
  readItems,
  readPagination,
  listPage,
  listAll,
  runList,
  MAX_PAGE_SIZE,
  RETURN_ALL_MAX_ITEMS,
};

export type NinjaPipeAuth = { baseUrl: string; apiKey: string };

export type NinjaPipeRecord = Record<string, unknown>;

export type NinjaPipePage = {
  items: NinjaPipeRecord[];
  count: number;
  total: number | null;
  hasMore: boolean;
  nextPage: number | null;
};
