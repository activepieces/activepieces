import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

export const HEARTBEAT_BASE_URL = 'https://api.heartbeat.chat/v0';

const REQUEST_TIMEOUT_MS = 30_000;
const RATE_LIMIT_RETRY_DELAYS_MS = [1_000, 2_000];
const MAX_ERROR_TEXT = 500;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LIST_ITEMS = 100;
const BLOCK_TAG_PATTERN = /^<(p|h1|h2|h3|ul)[\s>]/i;

export class HeartbeatApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({ operation, status, responseBody }: { operation: string; status: number; responseBody: unknown }) {
    super(`Heartbeat ${operation} failed (${status}): ${describeStatus({ status, responseBody })}`);
    this.name = 'HeartbeatApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function vendorMessage(responseBody: unknown): string {
  if (typeof responseBody === 'string' && responseBody.trim().length > 0) {
    return responseBody.trim().slice(0, MAX_ERROR_TEXT);
  }
  if (isRecord(responseBody)) {
    const message = responseBody['message'];
    if (typeof message === 'string' && message.length > 0) {
      return message.slice(0, MAX_ERROR_TEXT);
    }
    return JSON.stringify(responseBody).slice(0, MAX_ERROR_TEXT);
  }
  return 'no details returned';
}

function describeStatus({ status, responseBody }: { status: number; responseBody: unknown }): string {
  const detail = vendorMessage(responseBody);
  switch (status) {
    case 401:
    case 403:
      return `the API key is invalid or revoked, or your Heartbeat plan does not include API access. ${detail}`;
    case 404:
      return `not found. Check the IDs or email you passed. ${detail}`;
    case 429:
      return `Heartbeat rate limit reached, try again in a few seconds. ${detail}`;
    default:
      return detail;
  }
}

function statusOf(error: unknown): number | undefined {
  if (error instanceof HeartbeatApiError) {
    return error.status;
  }
  if (!isRecord(error) && !(error instanceof Error)) {
    return undefined;
  }
  const response: unknown = Reflect.get(error, 'response');
  if (isRecord(response) && typeof response['status'] === 'number') {
    return response['status'];
  }
  return undefined;
}

function responseBodyOf(error: unknown): unknown {
  if (error instanceof HeartbeatApiError) {
    return error.responseBody;
  }
  if (!isRecord(error) && !(error instanceof Error)) {
    return undefined;
  }
  const response: unknown = Reflect.get(error, 'response');
  return isRecord(response) ? response['body'] : undefined;
}

function errorMessageOf(error: unknown): string {
  const body = responseBodyOf(error);
  return isRecord(body) && typeof body['message'] === 'string' ? body['message'] : '';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toQueryParams(query: Record<string, QueryValue> | undefined): Record<string, string> {
  if (!query) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(query)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, String(value)]),
  );
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token.trim()}` };
}

async function request<T>({ token, method, path, operation, query, body, wait = sleep }: HeartbeatRequest): Promise<T> {
  const httpRequest: HttpRequest = {
    method,
    url: `${HEARTBEAT_BASE_URL}${path}`,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token: token.trim() },
    queryParams: toQueryParams(query),
    timeout: REQUEST_TIMEOUT_MS,
    followRedirects: false,
  };
  if (body !== undefined) {
    httpRequest.body = body;
    httpRequest.headers = { 'Content-Type': 'application/json' };
  }
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await httpClient.sendRequest<T>(httpRequest);
      if (response.status >= 300) {
        throw new HeartbeatApiError({ operation, status: response.status, responseBody: response.body });
      }
      return response.body;
    } catch (error) {
      const status = statusOf(error);
      if (status === undefined) {
        throw error;
      }
      if (status === 429 && attempt < RATE_LIMIT_RETRY_DELAYS_MS.length) {
        await wait(RATE_LIMIT_RETRY_DELAYS_MS[attempt]);
        continue;
      }
      if (error instanceof HeartbeatApiError) {
        throw error;
      }
      throw new HeartbeatApiError({ operation, status, responseBody: responseBodyOf(error) });
    }
  }
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

function uuid({ value, label }: Labeled): string {
  if (isBlank(value)) {
    throw new Error(`${label} is required.`);
  }
  const text = String(value).trim();
  if (!UUID_PATTERN.test(text)) {
    throw new Error(`${label} "${text.slice(0, 100)}" is not a valid Heartbeat ID (expected a UUID such as 3f2b6c1e-8d4a-4f6b-9c1d-2e5a7b8c9d0e).`);
  }
  return text.toLowerCase();
}

function optionalUuid({ value, label }: Labeled): string | undefined {
  return isBlank(value) ? undefined : uuid({ value, label });
}

function toStringList({ value, label }: Labeled): string[] {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  const raw: unknown[] = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[\n,]/)
      : [value];
  return raw.flatMap((item) => {
    if (item === undefined || item === null) {
      return [];
    }
    if (isRecord(item)) {
      throw new Error(`${label} must be a list of text values.`);
    }
    if (Array.isArray(item)) {
      return toStringList({ value: item, label });
    }
    const text = String(item).trim();
    return text.length > 0 ? [text] : [];
  });
}

function uuidList({ value, label, min = 0, max = MAX_LIST_ITEMS }: Labeled & ListBounds): string[] {
  const ids = [...new Set(toStringList({ value, label }).map((item) => uuid({ value: item, label })))];
  checkBounds({ count: ids.length, label, min, max });
  return ids;
}

function email({ value, label }: Labeled): string {
  if (isBlank(value)) {
    throw new Error(`${label} is required.`);
  }
  const text = String(value).trim();
  if (!EMAIL_PATTERN.test(text) || text.length > 320) {
    throw new Error(`${label} "${text.slice(0, 100)}" is not a valid email address.`);
  }
  return text;
}

function emailList({ value, label, min = 0, max = MAX_LIST_ITEMS }: Labeled & ListBounds): string[] {
  const seen = new Set<string>();
  const emails: string[] = [];
  for (const item of toStringList({ value, label })) {
    const checked = email({ value: item, label });
    const key = checked.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      emails.push(checked);
    }
  }
  checkBounds({ count: emails.length, label, min, max });
  return emails;
}

function listOrUndefined(values: string[]): string[] | undefined {
  return values.length > 0 ? values : undefined;
}

function checkBounds({ count, label, min = 0, max = MAX_LIST_ITEMS }: { count: number; label: string } & ListBounds): void {
  if (count < min) {
    throw new Error(min === 1 ? `${label}: add at least one value.` : `${label}: add at least ${min} values.`);
  }
  if (count > max) {
    throw new Error(`${label}: at most ${max} values per run (got ${count}).`);
  }
}

function requiredText({ value, label }: Labeled): string {
  if (isBlank(value)) {
    throw new Error(`${label} is required.`);
  }
  return String(value);
}

function richText({ value, label }: Labeled): string {
  const text = requiredText({ value, label }).trim();
  if (BLOCK_TAG_PATTERN.test(text)) {
    return text;
  }
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => `<p>${line}</p>`)
    .join('');
}

function optionalText(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const text = String(value);
  return text.trim().length === 0 ? undefined : text;
}

function optionalUrl({ value, label }: Labeled): string | undefined {
  if (isBlank(value)) {
    return undefined;
  }
  const text = String(value).trim();
  if (!/^https?:\/\/\S+$/i.test(text)) {
    throw new Error(`${label} "${text.slice(0, 100)}" must be a full URL starting with http:// or https://.`);
  }
  return text;
}

function limit({ value, max, defaultValue }: { value: unknown; max: number; defaultValue: number }): number {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) {
    throw new Error(`Limit must be a whole number between 1 and ${max}.`);
  }
  return parsed;
}

function isoDate({ value, label }: Labeled): string | undefined {
  if (isBlank(value)) {
    return undefined;
  }
  const text = String(value).trim();
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${label} "${text.slice(0, 100)}" is not a valid date. Use ISO 8601, for example 2026-10-13T15:00:00Z.`);
  }
  return parsed.toISOString();
}

function triState(value: unknown): boolean | undefined {
  if (value === 'yes' || value === true) {
    return true;
  }
  if (value === 'no' || value === false) {
    return false;
  }
  return undefined;
}

function toPage({ items, pageLimit }: { items: Record<string, unknown>[]; pageLimit: number }): PageOutput {
  const hasMore = items.length >= pageLimit;
  const lastId = items[items.length - 1]?.['id'];
  return { items, nextCursor: hasMore && typeof lastId === 'string' ? lastId : null, hasMore };
}

function recordList(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

async function afterWrite<T>({ load, what }: { load: () => Promise<T>; what: string }): Promise<AfterWriteResult<T>> {
  try {
    return { value: await load(), lookupError: null };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      value: null,
      lookupError: `The change was saved in Heartbeat, but reading back ${what} failed (${reason}). Do not re-run this step for the same input, or the change may be made twice.`,
    };
  }
}

export const heartbeatApi = {
  request,
  authHeaders,
  statusOf,
  responseBodyOf,
  errorMessageOf,
  isRecord,
  uuid,
  optionalUuid,
  uuidList,
  email,
  emailList,
  listOrUndefined,
  requiredText,
  richText,
  optionalText,
  optionalUrl,
  limit,
  isoDate,
  triState,
  toPage,
  recordList,
  sleep,
  afterWrite,
};

export type AfterWriteResult<T> = { value: T | null; lookupError: string | null };

export type QueryValue = string | number | boolean | undefined | null;

export type HeartbeatRequest = {
  token: string;
  method: HttpMethod;
  path: string;
  operation: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
  wait?: (ms: number) => Promise<void>;
};

export type ListBounds = { min?: number; max?: number };

export type Labeled = { value: unknown; label: string };

export type PageOutput = {
  items: Record<string, unknown>[];
  nextCursor: string | null;
  hasMore: boolean;
};
