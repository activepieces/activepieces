import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

class SallaApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({ status, responseBody, path }: { status: number; responseBody: unknown; path?: string }) {
    super(buildErrorMessage({ status, responseBody, path }));
    this.name = 'SallaApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

async function request<T = unknown>({
  auth,
  method,
  path,
  query,
  body,
  timeout,
  sleep = defaultSleep,
  omitLanguage = false,
  keepLargeIds = false,
}: SallaRequestParams): Promise<SallaResponse<T>> {
  const httpRequest: HttpRequest = {
    method,
    url: buildUrl({ path, query }),
    headers: buildHeaders({ auth, omitLanguage }),
    body,
    timeout: timeout ?? REQUEST_TIMEOUT_MS,
    retries: method === HttpMethod.GET ? GET_RETRIES : 0,
  };
  return withRateLimitRetry<SallaResponse<T>>({
    sleep,
    send: async () => {
      try {
        if (keepLargeIds) {
          const response = await httpClient.sendRequest<string>({ ...httpRequest, responseType: 'text' });
          return { status: response.status, body: parseKeepingLargeIds<T>(response.body) };
        }
        const response = await httpClient.sendRequest<SallaEnvelope<T>>(httpRequest);
        return { status: response.status, body: response.body ?? {} };
      } catch (error) {
        const httpError = readHttpErrorLike(error);
        if (httpError) {
          throw new SallaApiError({ ...httpError, responseBody: parseJsonText(httpError.responseBody), path });
        }
        throw error;
      }
    },
  });
}

function parseKeepingLargeIds<T>(text: unknown): SallaEnvelope<T> {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return {};
  }
  const parsed: SallaEnvelope<T> | null = JSON.parse(text.replace(LARGE_ID_VALUE, '$1"$2"'));
  return parsed ?? {};
}

function parseJsonText(value: unknown): unknown {
  if (typeof value !== 'string' || !/^\s*[{[]/.test(value)) {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

async function withRateLimitRetry<T>({
  send,
  sleep,
}: {
  send: () => Promise<T>;
  sleep: (ms: number) => Promise<void>;
}): Promise<T> {
  let attempt = 0;
  for (;;) {
    try {
      return await send();
    } catch (error) {
      if (!isSallaApiError(error) || error.status !== 429 || attempt >= MAX_RATE_LIMIT_RETRIES) {
        throw error;
      }
      await sleep(rateLimitDelayMs(attempt));
      attempt += 1;
    }
  }
}

function rateLimitDelayMs(attempt: number): number {
  const safeAttempt = Number.isFinite(attempt) && attempt > 0 ? Math.floor(attempt) : 0;
  return Math.min(RATE_LIMIT_BASE_DELAY_MS * 2 ** safeAttempt, RATE_LIMIT_MAX_DELAY_MS);
}

async function fetchPaged<T = Record<string, unknown>>({
  auth,
  path,
  query,
  maxItems,
  perPage = DEFAULT_PER_PAGE,
  maxPages = MAX_PAGES,
  sleep,
  keepLargeIds = false,
}: {
  auth: SallaAuth;
  path: string;
  query?: SallaQuery;
  maxItems: number;
  perPage?: number;
  maxPages?: number;
  sleep?: (ms: number) => Promise<void>;
  keepLargeIds?: boolean;
}): Promise<{ items: T[]; truncated: boolean; pagesFetched: number }> {
  const cap = clampLimit(maxItems);
  const pageSize = Math.max(1, Math.min(Math.floor(perPage), MAX_PER_PAGE));
  const pageCap = Math.max(1, Math.min(Math.floor(maxPages), MAX_PAGES));
  const items: T[] = [];
  const seenFirstIds = new Set<string>();
  let page = 1;
  let hasMore = true;
  while (hasMore && page <= pageCap) {
    const response = await request<T[]>({
      auth,
      method: HttpMethod.GET,
      path,
      query: { ...(query ?? {}), page, per_page: pageSize },
      sleep,
      keepLargeIds,
    });
    const pageItems = Array.isArray(response.body.data) ? response.body.data : [];
    if (pageItems.length === 0) {
      return { items, truncated: false, pagesFetched: page };
    }
    const firstId = itemId(pageItems[0]);
    if (firstId !== undefined && seenFirstIds.has(firstId)) {
      return { items, truncated: hasMore, pagesFetched: page };
    }
    if (firstId !== undefined) {
      seenFirstIds.add(firstId);
    }
    hasMore = hasNextPage(response.body.pagination);
    for (const item of pageItems) {
      if (items.length >= cap) {
        return { items, truncated: true, pagesFetched: page };
      }
      items.push(item);
    }
    if (items.length >= cap) {
      return { items, truncated: hasMore, pagesFetched: page };
    }
    page += 1;
  }
  return { items, truncated: hasMore, pagesFetched: page - 1 };
}

function itemId(item: unknown): string | undefined {
  if (!isRecord(item)) {
    return undefined;
  }
  const id = item['id'];
  return typeof id === 'number' || typeof id === 'string' ? String(id) : undefined;
}

function hasNextPage(pagination: unknown): boolean {
  if (!isRecord(pagination)) {
    return false;
  }
  const currentPage = toFiniteNumber(pagination['currentPage']);
  const totalPages = toFiniteNumber(pagination['totalPages']);
  if (currentPage !== undefined && totalPages !== undefined) {
    return currentPage < totalPages;
  }
  if ('next' in pagination) {
    return isNextMarker(pagination['next']);
  }
  const links = pagination['links'];
  if (isRecord(links) && 'next' in links) {
    return isNextMarker(links['next']);
  }
  return false;
}

function buildUrl({ path, query }: { path: string; query?: SallaQuery }): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const search = buildQueryString(query);
  return search ? `${BASE_URL}${normalizedPath}?${search}` : `${BASE_URL}${normalizedPath}`;
}

function buildQueryString(query: SallaQuery | undefined): string {
  if (!query) {
    return '';
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      const arrayKey = key.endsWith('[]') ? key : `${key}[]`;
      for (const entry of value) {
        if (isPresent(entry)) {
          params.append(arrayKey, String(entry));
        }
      }
    } else if (isPresent(value)) {
      params.append(key, String(value));
    }
  }
  return params.toString();
}

function buildHeaders({ auth, omitLanguage }: { auth: SallaAuth; omitLanguage: boolean }): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${auth.access_token}`,
    Accept: 'application/json',
  };
  const language = omitLanguage ? undefined : readLanguage(auth);
  if (language) {
    headers['Accept-Language'] = language;
  }
  return headers;
}

function readLanguage(auth: SallaAuth): string | undefined {
  const value = auth.props?.['language'];
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed !== 'default' ? trimmed : undefined;
}

function buildErrorMessage({ status, responseBody, path }: { status: number; responseBody: unknown; path?: string }): string {
  const vendorMessage = extractVendorMessage(responseBody);
  if (status === 401) {
    const missingScopes = extractMissingScopes(vendorMessage);
    if (missingScopes) {
      return `Salla rejected the request because the token lacks the scope ${missingScopes}. In the Salla Partners Portal open your app, tick that scope under App Scopes, then reconnect this Salla connection.`;
    }
    return `Salla rejected the access token (401${vendorMessage ? `: ${vendorMessage}` : ''}). Reconnect the Salla connection. If it keeps failing, check that the app still has access to the store.`;
  }
  const base = vendorMessage ? `Salla API error (${status}): ${vendorMessage}` : `Salla API error (${status})`;
  const hint = statusHint({ status, path });
  return hint ? `${base}. ${hint}.` : `${base}.`;
}

function statusHint({ status, path }: { status: number; path?: string }): string | undefined {
  if (status === 429 && isUnderPath({ path, root: '/customers' })) {
    return CUSTOMERS_RATE_LIMIT_HINT;
  }
  if (status === 404 && isUnderPath({ path, root: '/orders' })) {
    return `${STATUS_HINTS[404]}. ${ORDERS_NOT_FOUND_HINT}`;
  }
  return STATUS_HINTS[status];
}

function isUnderPath({ path, root }: { path: string | undefined; root: string }): boolean {
  if (typeof path !== 'string') {
    return false;
  }
  const normalized = path.trim().startsWith('/') ? path.trim() : `/${path.trim()}`;
  return normalized === root || normalized.startsWith(`${root}/`) || normalized.startsWith(`${root}?`);
}

function extractVendorMessage(responseBody: unknown): string | undefined {
  if (typeof responseBody === 'string') {
    const trimmed = responseBody.trim();
    if (trimmed.length === 0) {
      return undefined;
    }
    if (/^<(!doctype|html|\?xml)/i.test(trimmed)) {
      return 'Salla returned an HTML page instead of JSON';
    }
    return trimTrailingPunctuation(trimmed.slice(0, MAX_MESSAGE_LENGTH));
  }
  if (!isRecord(responseBody)) {
    return undefined;
  }
  const error = responseBody['error'];
  const source = isRecord(error) ? error : responseBody;
  const parts: string[] = [];
  const message = source['message'];
  if (typeof message === 'string' && message.trim().length > 0 && !GENERIC_MESSAGES.has(message.trim())) {
    parts.push(trimTrailingPunctuation(message));
  }
  const fields = describeFieldErrors(source['fields']);
  if (fields) {
    parts.push(fields);
  }
  if (parts.length === 0 && typeof message === 'string' && message.trim().length > 0) {
    parts.push(GENERIC_MESSAGES.get(message.trim()) ?? message.trim());
  }
  if (parts.length === 0 && typeof error === 'string' && error.trim().length > 0) {
    parts.push(trimTrailingPunctuation(error));
  }
  return parts.length > 0 ? parts.join('; ').slice(0, MAX_MESSAGE_LENGTH) : undefined;
}

function describeFieldErrors(fields: unknown): string | undefined {
  if (!isRecord(fields)) {
    return undefined;
  }
  const lines: string[] = [];
  for (const [field, value] of Object.entries(fields)) {
    const messages = Array.isArray(value)
      ? value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
      : typeof value === 'string' && value.trim().length > 0
      ? [value]
      : [];
    if (messages.length > 0) {
      lines.push(`${field}: ${messages.map(trimTrailingPunctuation).join(', ')}`);
    }
  }
  return lines.length > 0 ? `invalid fields: ${lines.join('; ')}` : undefined;
}

function extractMissingScopes(message: string | undefined): string | undefined {
  if (!message) {
    return undefined;
  }
  const match = /access to one of those scopes:\s*(.+)$/i.exec(message);
  if (!match) {
    return undefined;
  }
  const scopes = trimTrailingPunctuation(match[1]);
  return scopes.length > 0 ? scopes : undefined;
}

function readHttpErrorLike(value: unknown): { status: number; responseBody: unknown } | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const response = value['response'];
  if (!isRecord(response) || typeof response['status'] !== 'number') {
    return undefined;
  }
  return { status: response['status'], responseBody: response['body'] };
}

function isSallaApiError(value: unknown): value is SallaApiError {
  return value instanceof SallaApiError;
}

function clampLimit(limit: number | undefined | null): number {
  if (limit === undefined || limit === null || !Number.isFinite(limit) || limit <= 0) {
    return DEFAULT_LIMIT;
  }
  return Math.min(Math.floor(limit), MAX_ITEMS);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPresent(value: unknown): boolean {
  return value !== undefined && value !== null && value !== '';
}

function isNextMarker(value: unknown): boolean {
  return isPresent(value) && value !== false && value !== 0;
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0 && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

function trimTrailingPunctuation(text: string): string {
  return text.trim().replace(/[.!?;:,\s]+$/, '');
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const BASE_URL = 'https://api.salla.dev/admin/v2';
const REQUEST_TIMEOUT_MS = 30000;
const LARGE_ID_VALUE = /("id"\s*:\s*)(-?\d{16,})(?=\s*[,}])/g;
const GET_RETRIES = 2;
const MAX_RATE_LIMIT_RETRIES = 2;
const RATE_LIMIT_BASE_DELAY_MS = 2000;
const RATE_LIMIT_MAX_DELAY_MS = 8000;
const DEFAULT_PER_PAGE = 30;
const MAX_PER_PAGE = 60;
const MAX_PAGES = 50;
const DEFAULT_LIMIT = 50;
const MAX_ITEMS = 1000;
const MAX_MESSAGE_LENGTH = 600;

const GENERIC_MESSAGES = new Map<string, string>([
  ['alert.invalid_fields', 'invalid fields'],
  ['error', 'request failed'],
]);

const CUSTOMERS_RATE_LIMIT_HINT =
  'Salla rate limit reached. Customer endpoints allow only 500 requests per 10 minutes for each IP address. Wait a few minutes, then retry';

const ORDERS_NOT_FOUND_HINT =
  'For orders, use the internal order ID (for example 2116149737), not the reference number customers see';

const STATUS_HINTS: Record<number, string> = {
  400: 'Check the values sent to Salla',
  403: 'Salla blocked this request for the connected store. Check that the app is still installed and allowed for this store',
  404: 'Check the ID: the record may have been deleted, or the ID belongs to another store',
  405: 'Salla does not allow this operation on the record',
  410: 'The record no longer exists in Salla',
  422: 'Fix the listed fields and try again',
  429: 'Salla rate limit reached (120 to 720 requests per minute, depending on the store plan). Wait a minute, then retry',
  500: 'Salla had an internal error. Retry later',
  503: 'Salla is temporarily unavailable. Retry later',
};

export const sallaApi = {
  request,
  fetchPaged,
  withRateLimitRetry,
  rateLimitDelayMs,
  hasNextPage,
  buildUrl,
  buildQueryString,
  buildErrorMessage,
  extractVendorMessage,
  isSallaApiError,
  isRecord,
  clampLimit,
};

export { SallaApiError, BASE_URL, DEFAULT_LIMIT, MAX_ITEMS, MAX_PER_PAGE };

type SallaQueryValue = string | number | boolean | null | undefined | Array<string | number>;

type SallaQuery = Record<string, SallaQueryValue>;

type SallaAuth = {
  access_token: string;
  props?: Record<string, unknown>;
};

type SallaEnvelope<T> = {
  status?: number;
  success?: boolean;
  data?: T;
  pagination?: unknown;
  error?: unknown;
};

type SallaResponse<T> = {
  status: number;
  body: SallaEnvelope<T>;
};

type SallaRequestParams = {
  auth: SallaAuth;
  method: HttpMethod;
  path: string;
  query?: SallaQuery;
  body?: unknown;
  timeout?: number;
  sleep?: (ms: number) => Promise<void>;
  omitLanguage?: boolean;
  keepLargeIds?: boolean;
};

export type { SallaAuth, SallaQuery, SallaQueryValue, SallaEnvelope, SallaResponse, SallaRequestParams };
