import { HttpMethod, HttpRequest, HttpResponse, httpClient } from '@activepieces/pieces-common';

const DRIP_ORIGIN = 'https://api.getdrip.com';
const USER_AGENT = 'Activepieces (www.activepieces.com)';
const REQUEST_TIMEOUT_MS = 30_000;
const RATE_LIMIT_RETRY_DELAYS_MS = [10_000, 15_000];
const MAX_ERROR_TEXT = 500;
const ACCOUNT_ID_PATTERN = /^\d+$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

export class DripApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly responseBody: unknown;

  constructor({ operation, status, responseBody }: { operation: string; status: number; responseBody: unknown }) {
    const code = firstErrorCode(responseBody);
    super(`Drip ${operation} failed (${status}${code ? ` ${code}` : ''}): ${describeStatus({ status, responseBody })}`);
    this.name = 'DripApiError';
    this.status = status;
    this.code = code;
    this.responseBody = responseBody;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function firstError(responseBody: unknown): Record<string, unknown> | undefined {
  if (!isRecord(responseBody) || !Array.isArray(responseBody['errors'])) {
    return undefined;
  }
  const first: unknown = responseBody['errors'][0];
  return isRecord(first) ? first : undefined;
}

function firstErrorCode(responseBody: unknown): string | undefined {
  const code = firstError(responseBody)?.['code'];
  return typeof code === 'string' ? code : undefined;
}

function vendorMessage(responseBody: unknown): string {
  if (typeof responseBody === 'string' && responseBody.length > 0) {
    return responseBody.slice(0, MAX_ERROR_TEXT);
  }
  if (isRecord(responseBody) && Array.isArray(responseBody['errors'])) {
    const parts = responseBody['errors']
      .filter(isRecord)
      .map((error) => {
        const message = typeof error['message'] === 'string' ? error['message'] : String(error['code'] ?? 'error');
        return typeof error['attribute'] === 'string' ? `${error['attribute']}: ${message}` : message;
      });
    if (parts.length > 0) {
      return parts.join('; ').slice(0, MAX_ERROR_TEXT);
    }
  }
  if (isRecord(responseBody)) {
    if (typeof responseBody['message'] === 'string') {
      return responseBody['message'].slice(0, MAX_ERROR_TEXT);
    }
    return JSON.stringify(responseBody).slice(0, MAX_ERROR_TEXT);
  }
  return 'no details returned';
}

function describeStatus({ status, responseBody }: { status: number; responseBody: unknown }): string {
  const detail = vendorMessage(responseBody);
  if (status === 401) {
    return `the API token is invalid or was revoked. ${detail}`;
  }
  if (status === 403 && /disabled/i.test(detail)) {
    return `the Drip account is disabled (usually billing or an ended trial); reactivate it in Drip. ${detail}`;
  }
  if (status === 403) {
    return `Drip refused the request (no access, or the change is not allowed in this state). ${detail}`;
  }
  if (status === 404) {
    return `not found. Check the account ID and the IDs or email you passed. ${detail}`;
  }
  if (status === 422) {
    return `Drip rejected the input. ${detail}`;
  }
  if (status === 429) {
    return `Drip rate limit reached (3,600 requests per hour, 50 per hour for batch endpoints, or too many concurrent updates to one subscriber); try again later. ${detail}`;
  }
  return detail;
}

function statusOf(error: unknown): number | undefined {
  if (error instanceof DripApiError) {
    return error.status;
  }
  if (!(error instanceof Error) && !isRecord(error)) {
    return undefined;
  }
  const response: unknown = Reflect.get(error, 'response');
  if (isRecord(response) && typeof response['status'] === 'number') {
    return response['status'];
  }
  return undefined;
}

function responseBodyOf(error: unknown): unknown {
  if (!(error instanceof Error) && !isRecord(error)) {
    return undefined;
  }
  const response: unknown = Reflect.get(error, 'response');
  return isRecord(response) ? response['body'] : undefined;
}

function isNotFound(error: unknown): boolean {
  return statusOf(error) === 404;
}

function authHeader(token: string): string {
  return `Basic ${Buffer.from(token.trim()).toString('base64')}`;
}

function seg({ value, label }: { value: unknown; label: string }): string {
  const text = requireText({ value, label });
  if (text === '.' || text === '..') {
    throw new Error(`${label} "${text}" is not valid.`);
  }
  return encodeURIComponent(text);
}

function requireText({ value, label }: { value: unknown; label: string }): string {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw new Error(`${label} is required.`);
  }
  return String(value).trim();
}

function identify({ value, label }: { value: unknown; label: string }): { email: string } | { id: string } {
  const text = requireText({ value, label });
  return text.includes('@') ? { email: text } : { id: text };
}

function optionalText(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const text = String(value).trim();
  return text === '' ? undefined : text;
}

function parseAccountId(value: unknown): string {
  const text = requireText({ value, label: 'Account ID' });
  if (!ACCOUNT_ID_PATTERN.test(text)) {
    throw new Error(`"${text.slice(0, 100)}" is not a valid Drip account ID (digits only, e.g. 1234567). Use List Accounts to find it.`);
  }
  return text;
}

function parseNumericId({ value, label }: { value: unknown; label: string }): string {
  const text = requireText({ value, label });
  if (!ACCOUNT_ID_PATTERN.test(text)) {
    throw new Error(`"${text.slice(0, 100)}" is not a valid ${label} (digits only).`);
  }
  return text;
}

function validateInteger({ value, label, min, max }: { value: unknown; label: string; min: number; max: number }): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new Error(`${label} must be a whole number between ${min} and ${max}.`);
  }
  return number;
}

function validateNumber({ value, label, min }: { value: unknown; label: string; min?: number }): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const number = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(number) || (min !== undefined && number < min)) {
    throw new Error(`${label} must be a number${min !== undefined ? ` of at least ${min}` : ''}.`);
  }
  return number;
}

function parseIsoDate({ value, label }: { value: unknown; label: string }): string | undefined {
  const text = optionalText(value);
  if (text === undefined) {
    return undefined;
  }
  if (!ISO_DATE_PATTERN.test(text) || Number.isNaN(Date.parse(text))) {
    throw new Error(`${label} must be an ISO-8601 date or date-time, e.g. 2026-01-31T09:00:00Z.`);
  }
  return new Date(text).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function parseObject({ value, label }: { value: unknown; label: string }): Record<string, unknown> | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  let parsed: unknown = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error(`${label} must be a JSON object, e.g. {"key": "value"}.`);
    }
  }
  if (!isRecord(parsed)) {
    throw new Error(`${label} must be an object of key/value pairs.`);
  }
  return parsed;
}

function parseArray({ value, label }: { value: unknown; label: string }): unknown[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  let parsed: unknown = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error(`${label} must be a JSON array.`);
    }
  }
  if (!Array.isArray(parsed)) {
    throw new Error(`${label} must be a list (JSON array).`);
  }
  return parsed;
}

function textList(value: unknown): string[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const raw = Array.isArray(value) ? value : String(value).split(',');
  const seen = new Set<string>();
  for (const item of raw.flat()) {
    const text = optionalText(item);
    if (text !== undefined) {
      seen.add(text);
    }
  }
  return [...seen];
}

function compact(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

function paging({ page, perPage, max }: { page: unknown; perPage: unknown; max: number }): { page: number; perPage: number } {
  return {
    page: validateInteger({ value: page, label: 'Page', min: 1, max: 1_000_000 }) ?? 1,
    perPage: validateInteger({ value: perPage, label: 'Results per Page', min: 1, max }) ?? Math.min(100, max),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toQueryParams(query: Record<string, DripQueryValue> | undefined): Record<string, string> {
  if (!query) {
    return {};
  }
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      result[key] = String(value);
    }
  }
  return result;
}

async function send<T>({ token, method, path, version = 'v2', operation, query, body, wait = sleep }: DripRequest): Promise<HttpResponse<T>> {
  if (!path.startsWith('/')) {
    throw new Error(`Internal error: Drip path must start with "/" (${operation}).`);
  }
  const httpRequest: HttpRequest = {
    method,
    url: `${DRIP_ORIGIN}/${version}${path}`,
    headers: { Authorization: authHeader(token), 'User-Agent': USER_AGENT },
    queryParams: toQueryParams(query),
    timeout: REQUEST_TIMEOUT_MS,
    followRedirects: false,
  };
  if (body !== undefined) {
    httpRequest.body = body;
    httpRequest.headers = { ...httpRequest.headers, 'Content-Type': 'application/json' };
  }
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await httpClient.sendRequest<T>(httpRequest);
      if (response.status >= 300) {
        throw new DripApiError({ operation, status: response.status, responseBody: response.body });
      }
      return response;
    } catch (error) {
      if (error instanceof DripApiError) {
        throw error;
      }
      const status = statusOf(error);
      if (status === undefined) {
        throw error;
      }
      if (status === 429 && attempt < RATE_LIMIT_RETRY_DELAYS_MS.length) {
        await wait(RATE_LIMIT_RETRY_DELAYS_MS[attempt]);
        continue;
      }
      throw new DripApiError({ operation, status, responseBody: responseBodyOf(error) });
    }
  }
}

async function request<T>(params: DripRequest): Promise<T> {
  const response = await send<T>(params);
  return response.body;
}

async function listAccounts(token: string): Promise<DripAccount[]> {
  const body = await request<{ accounts?: DripAccount[] }>({ token, method: HttpMethod.GET, path: '/accounts', operation: 'list accounts' });
  return Array.isArray(body.accounts) ? body.accounts : [];
}

async function resolveAccountId({ token, accountId }: { token: string; accountId: unknown }): Promise<string> {
  const given = optionalText(accountId);
  if (given !== undefined) {
    return parseAccountId(given);
  }
  const accounts = await listAccounts(token);
  if (accounts.length === 0) {
    throw new Error('This Drip API token has no accounts.');
  }
  if (accounts.length > 1) {
    const choices = accounts.map((account) => `${account.id}: ${account.name}`).join(', ');
    throw new Error(`This Drip API token has ${accounts.length} accounts; pass the Account ID of one of them (${choices.slice(0, MAX_ERROR_TEXT)}).`);
  }
  return parseAccountId(accounts[0].id);
}

function accountPath(accountId: string): string {
  return `/${parseAccountId(accountId)}`;
}

function pageInfo({ meta, page, perPage, count }: { meta: unknown; page: number; perPage: number; count: number }): PageInfo {
  const totalPages = isRecord(meta) && typeof meta['total_pages'] === 'number' ? meta['total_pages'] : undefined;
  const totalCount = isRecord(meta) && typeof meta['total_count'] === 'number' ? meta['total_count'] : undefined;
  const hasMore = totalPages !== undefined ? page < totalPages : count >= perPage;
  return { page, totalPages: totalPages ?? null, totalCount: totalCount ?? null, hasMore };
}

async function listPage({
  token,
  accountId,
  resource,
  key,
  operation,
  page,
  perPage,
  query,
}: {
  token: string;
  accountId: string;
  resource: string;
  key: string;
  operation: string;
  page: number;
  perPage: number;
  query?: Record<string, DripQueryValue>;
}): Promise<{ items: DripRecord[] } & PageInfo> {
  const body = await request<Record<string, unknown>>({
    token,
    method: HttpMethod.GET,
    path: `${accountPath(accountId)}${resource}`,
    operation,
    query: { ...query, page, per_page: perPage },
  });
  const raw = body[key];
  const items = Array.isArray(raw) ? raw.filter(isRecord) : [];
  return { items, ...pageInfo({ meta: body['meta'], page, perPage, count: items.length }) };
}

function firstRecord({ body, key, operation }: { body: unknown; key: string; operation: string }): DripRecord {
  const list = isRecord(body) ? body[key] : undefined;
  const first: unknown = Array.isArray(list) ? list[0] : undefined;
  if (!isRecord(first)) {
    throw new Error(`Drip ${operation} returned no ${key} record.`);
  }
  return first;
}

function recordList({ body, key }: { body: unknown; key: string }): DripRecord[] {
  const list = isRecord(body) ? body[key] : undefined;
  return Array.isArray(list) ? list.filter(isRecord) : [];
}

export const dripApi = {
  send,
  request,
  listAccounts,
  resolveAccountId,
  accountPath,
  listPage,
  pageInfo,
  firstRecord,
  recordList,
  authHeader,
  seg,
  requireText,
  optionalText,
  identify,
  parseAccountId,
  parseNumericId,
  validateInteger,
  validateNumber,
  parseIsoDate,
  parseObject,
  parseArray,
  textList,
  compact,
  paging,
  isNotFound,
  statusOf,
  isRecord,
  vendorMessage,
  sleep,
  DRIP_ORIGIN,
  USER_AGENT,
  RATE_LIMIT_RETRY_DELAYS_MS,
};

export type DripQueryValue = string | number | boolean | undefined | null;

export type DripRequest = {
  token: string;
  method: HttpMethod;
  path: string;
  version?: 'v2' | 'v3';
  operation: string;
  query?: Record<string, DripQueryValue>;
  body?: unknown;
  wait?: (ms: number) => Promise<void>;
};

export type DripRecord = Record<string, unknown>;

export type PageInfo = {
  page: number;
  totalPages: number | null;
  totalCount: number | null;
  hasMore: boolean;
};

export type DripAccount = {
  id: string;
  name: string;
  url?: string | null;
  primary_email?: string | null;
  default_from_name?: string | null;
  default_from_email?: string | null;
  created_at?: string | null;
};
