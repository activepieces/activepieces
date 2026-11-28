import { Readable } from 'node:stream';
import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';

const API_PATH = '/api';
const REQUEST_TIMEOUT_MS = 60_000;
const TRANSFER_TIMEOUT_MS = 300_000;
const MAX_ERROR_TEXT = 500;
const DEFAULT_PAGE_SIZE = 100;
const MAX_ALL_ITEMS = 10_000;
const SEARCH_MAX_ROWS = 2_000;
const SEARCH_TIME_BUDGET_MS = 180_000;
const MAX_REDIRECTS = 5;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const DATABASE_ID_PATTERN = /^\d+-\d+$/;
const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:\/\//i;
const CERTIFICATE_ERROR_CODES = new Set([
  'SELF_SIGNED_CERT_IN_CHAIN',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'UNABLE_TO_GET_ISSUER_CERT',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'CERT_HAS_EXPIRED',
  'CERT_NOT_YET_VALID',
  'ERR_TLS_CERT_ALTNAME_INVALID',
]);
let verifiedTlsAgent: Promise<unknown> | undefined;

class YoutrackApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({ message, status, responseBody }: { message: string; status: number; responseBody: unknown }) {
    super(message);
    this.name = 'YoutrackApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

function verifiedTls(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(
    ({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } })
  );
  return verifiedTlsAgent;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function recordOf(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function optionalText(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text === '' ? undefined : text;
}

function textOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function booleanOrNull(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function normalizeBaseUrl(raw: unknown): string {
  let text = optionalText(raw) ?? '';
  if (text === '') return '';
  if (text.startsWith('//')) {
    text = `https:${text}`;
  } else if (!SCHEME_PATTERN.test(text)) {
    text = `https://${text}`;
  }
  text = text.replace(/\/+$/, '');
  if (/\/api$/i.test(text)) {
    text = text.slice(0, -4).replace(/\/+$/, '');
  }
  return text;
}

function checkBaseUrl(raw: unknown): { ok: true; baseUrl: string } | { ok: false; error: string } {
  const baseUrl = normalizeBaseUrl(raw);
  if (baseUrl === '') {
    return { ok: false, error: 'Enter your YouTrack Instance URL, for example https://example.youtrack.cloud.' };
  }
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    return {
      ok: false,
      error: `The Instance URL "${String(raw).trim().slice(0, 100)}" is not a valid URL. Use the address you open YouTrack at, for example https://example.youtrack.cloud or https://youtrack.example.com/youtrack.`,
    };
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { ok: false, error: 'The Instance URL must start with https:// (or http:// for a local YouTrack Server).' };
  }
  if (url.hostname === '') {
    return { ok: false, error: 'The Instance URL has no host name. Use for example https://example.youtrack.cloud.' };
  }
  if (url.username !== '' || url.password !== '') {
    return { ok: false, error: 'The Instance URL must not contain a user name or password. Put the permanent token in the Permanent Token field.' };
  }
  if (url.search !== '' || url.hash !== '') {
    return { ok: false, error: 'The Instance URL must not contain a query string (?) or a # fragment.' };
  }
  return { ok: true, baseUrl };
}

function baseUrlOf(raw: unknown): string {
  const baseUrl = normalizeBaseUrl(raw);
  if (baseUrl === '') {
    throw new Error('The YouTrack connection has no Instance URL. Edit the connection and enter it, for example https://example.youtrack.cloud.');
  }
  try {
    new URL(baseUrl);
  } catch {
    throw new Error(`The Instance URL "${String(raw).trim().slice(0, 100)}" of the YouTrack connection is not a valid URL. Edit the connection and use the address you open YouTrack at, for example https://example.youtrack.cloud.`);
  }
  return baseUrl;
}

function connectionOf(auth: unknown): { baseUrl: string; token: string } {
  const props = isRecord(auth) && isRecord(auth['props']) ? auth['props'] : undefined;
  const token = optionalText(props?.['apiToken']);
  if (props === undefined || optionalText(props['baseUrl']) === undefined || token === undefined) {
    throw new Error('No YouTrack connection selected. Choose a connection on this step before running it.');
  }
  return { baseUrl: baseUrlOf(props['baseUrl']), token };
}

function segment({ value, label }: { value: unknown; label: string }): string {
  const text = optionalText(value);
  if (text === undefined || text === '.' || text === '..') {
    throw new Error(`${label} is required.`);
  }
  return encodeURIComponent(text);
}

function isDatabaseId(value: string): boolean {
  return DATABASE_ID_PATTERN.test(value);
}

function buildQuery(query?: Record<string, QueryValue>): QueryParams {
  const result: QueryParams = {};
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null) continue;
    const text = String(value);
    if (text !== '') {
      result[key] = text;
    }
  }
  return result;
}

function vendorMessage(body: unknown): string | undefined {
  if (isRecord(body)) {
    const description = optionalText(body['error_description']);
    const code = optionalText(body['error']);
    const message = optionalText(body['message']);
    const text = description ?? message ?? code;
    if (text !== undefined) {
      const withCode = code !== undefined && text !== code ? `${text} (${code})` : text;
      return withCode.slice(0, MAX_ERROR_TEXT);
    }
    return undefined;
  }
  if (Buffer.isBuffer(body)) {
    return vendorMessage(body.toString('utf8'));
  }
  const text = optionalText(body);
  if (text === undefined) return undefined;
  if (/^\s*</.test(text)) {
    return 'the server answered with an HTML page instead of YouTrack JSON';
  }
  return text.slice(0, MAX_ERROR_TEXT);
}

function failureOf(error: unknown): { status: number; body: unknown } | null {
  if (error === null || typeof error !== 'object') return null;
  const response = Reflect.get(error, 'response');
  if (!isRecord(response)) return null;
  const status = response['status'];
  return typeof status === 'number' ? { status, body: response['body'] } : null;
}

function toApiError({ status, body, operation }: { status: number; body: unknown; operation: string }): YoutrackApiError {
  const vendor = vendorMessage(body);
  const hint = status === 401 || status === 403
    ? ' Check the permanent token of the connection and that it has the YouTrack scope and access to this item.'
    : '';
  return new YoutrackApiError({
    message: `YouTrack could not ${operation} (HTTP ${status})${vendor !== undefined ? `: ${vendor}` : '.'}${hint}`,
    status,
    responseBody: body,
  });
}

function isAbort(error: unknown): boolean {
  if (error === null || typeof error !== 'object') return false;
  const name = Reflect.get(error, 'name');
  return name === 'AbortError' || name === 'TimeoutError';
}

function errorCode(error: unknown): string | undefined {
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current !== null && typeof current === 'object'; depth++) {
    const code = Reflect.get(current, 'code');
    if (typeof code === 'string') return code;
    current = Reflect.get(current, 'cause');
  }
  return undefined;
}

function networkError({ error, baseUrl, operation }: { error: unknown; baseUrl: string; operation: string }): Error {
  const code = errorCode(error);
  if (code !== undefined && CERTIFICATE_ERROR_CODES.has(code)) {
    return new Error(
      `YouTrack could not ${operation}: the TLS certificate of ${baseUrl} is self-signed, expired or not trusted (${code}). Activepieces verifies certificates; install a certificate from a trusted certificate authority on your YouTrack Server.`
    );
  }
  const reason = error instanceof Error ? error.message : String(error);
  const detail = code !== undefined && !reason.includes(code) ? `${reason}, ${code}` : reason;
  return new Error(
    `YouTrack could not ${operation}: could not reach ${baseUrl} (${detail}). Check the Instance URL of the connection and that the server is reachable.`
  );
}

async function send<T>({
  baseUrl,
  token,
  method,
  path,
  query,
  body,
  headers,
  timeoutMs,
  responseType,
  operation,
}: SendParams): Promise<T> {
  const timeout = timeoutMs ?? REQUEST_TIMEOUT_MS;
  const hasBody = body !== undefined && method !== HttpMethod.GET && method !== HttpMethod.DELETE;
  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    ...headers,
  };
  if (hasBody && requestHeaders['Content-Type'] === undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }
  const dispatcher = await verifiedTls();
  try {
    const response = await httpClient.sendRequest<T>(
      {
        method,
        url: `${baseUrl}${API_PATH}${path}`,
        headers: requestHeaders,
        queryParams: buildQuery(query),
        body: hasBody ? body : undefined,
        timeout,
        retries: 0,
        responseType,
        followRedirects: false,
        redactBodyInErrors: true,
      },
      { dispatcher }
    );
    if (response.status >= 300) {
      throw redirectError({ status: response.status, location: response.headers?.['location'], baseUrl, operation });
    }
    return response.body;
  } catch (error) {
    throw translateError({ error, baseUrl, operation, timeout });
  }
}

function redirectError({ status, location, baseUrl, operation }: { status: number; location: unknown; baseUrl: string; operation: string }): YoutrackApiError {
  const shown = typeof location === 'string' && location !== '' ? withoutQuery({ url: location, baseUrl }) : '';
  const target = shown !== '' ? ` to ${shown.slice(0, 200)}` : '';
  return new YoutrackApiError({
    message: `YouTrack could not ${operation} (HTTP ${status}): ${baseUrl} answered with a redirect${target}. Check the Instance URL of the connection (scheme, host and path).`,
    status,
    responseBody: undefined,
  });
}

function withoutQuery({ url, baseUrl }: { url: string; baseUrl: string }): string {
  try {
    const parsed = new URL(url, baseUrl);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split(/[?#]/)[0] ?? '';
  }
}

function translateError({ error, baseUrl, operation, timeout }: { error: unknown; baseUrl: string; operation: string; timeout: number }): Error {
  if (error instanceof YoutrackApiError) return error;
  const failure = failureOf(error);
  if (failure !== null) {
    return toApiError({ ...failure, operation });
  }
  if (isAbort(error)) {
    return new Error(`YouTrack could not ${operation}: the request timed out after ${Math.round(timeout / 1000)} s.`);
  }
  return networkError({ error, baseUrl, operation });
}

async function request<T>({ auth, ...rest }: RequestParams): Promise<T> {
  const { baseUrl, token } = connectionOf(auth);
  return send<T>({ ...rest, baseUrl, token });
}

async function listPage({ auth, path, query, limit, skip, operation }: ListPageParams): Promise<{ items: Record<string, unknown>[]; hasMore: boolean }> {
  const wanted = positiveInteger({ value: limit, label: 'Limit' });
  const start = skip === undefined || skip === null ? 0 : nonNegativeInteger({ value: skip, label: 'Skip' });
  const collected: Record<string, unknown>[] = [];
  let offset = start;
  while (collected.length <= wanted) {
    const top = Math.min(DEFAULT_PAGE_SIZE, wanted + 1 - collected.length);
    const page = await request<unknown>({
      auth,
      method: HttpMethod.GET,
      path,
      query: { ...query, $top: top, $skip: offset },
      operation,
    });
    const batch = records(page);
    collected.push(...batch);
    offset += batch.length;
    if (batch.length < top) break;
  }
  return { items: collected.slice(0, wanted), hasMore: collected.length > wanted };
}

async function searchPage({ auth, path, query, limit, skip, matches, operation }: SearchPageParams): Promise<{ items: Record<string, unknown>[]; hasMore: boolean; scanLimitReached: boolean }> {
  const wanted = positiveInteger({ value: limit, label: 'Limit' });
  const start = skip === undefined || skip === null ? 0 : nonNegativeInteger({ value: skip, label: 'Skip' });
  const needed = start + wanted + 1;
  const deadline = Date.now() + SEARCH_TIME_BUDGET_MS;
  const found: Record<string, unknown>[] = [];
  let scanned = 0;
  let exhausted = false;
  while (found.length < needed && scanned < SEARCH_MAX_ROWS && Date.now() < deadline) {
    const page = await request<unknown>({
      auth,
      method: HttpMethod.GET,
      path,
      query: { ...query, $top: DEFAULT_PAGE_SIZE, $skip: scanned },
      operation,
    });
    const batch = records(page);
    scanned += batch.length;
    for (const row of batch) {
      if (found.length < needed && matches(row)) {
        found.push(row);
      }
    }
    if (batch.length < DEFAULT_PAGE_SIZE) {
      exhausted = true;
      break;
    }
  }
  const hasMore = found.length > start + wanted;
  return { items: found.slice(start, start + wanted), hasMore, scanLimitReached: !hasMore && !exhausted };
}

async function listUpTo({ auth, path, query, limit, fallback, skip, operation }: ListUpToParams): Promise<Record<string, unknown>[]> {
  const wanted = lenientLimit({ value: limit, fallback });
  if (wanted === 'all') {
    const start = skip === undefined || skip === null ? 0 : nonNegativeInteger({ value: skip, label: 'Skip' });
    return listAll({ auth, path, query, maxItems: MAX_ALL_ITEMS, skip: start, operation });
  }
  const { items } = await listPage({ auth, path, query, limit: wanted, skip, operation });
  return items;
}

function lenientLimit({ value, fallback }: { value: unknown; fallback: number }): number | 'all' {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed <= 0) return 'all';
  return Math.max(1, Math.floor(parsed));
}

async function listAll({ auth, path, query, maxItems, operation, pageSize, skip }: ListAllParams): Promise<Record<string, unknown>[]> {
  const size = pageSize ?? DEFAULT_PAGE_SIZE;
  const start = skip ?? 0;
  const collected: Record<string, unknown>[] = [];
  for (;;) {
    const page = await request<unknown>({
      auth,
      method: HttpMethod.GET,
      path,
      query: { ...query, $top: size, $skip: start + collected.length },
      operation,
    });
    const batch = records(page);
    collected.push(...batch);
    if (batch.length < size) return collected;
    if (collected.length >= maxItems) {
      const hasMore = collected.length > maxItems || await hasEntryAt({ auth, path, query, skip: start + collected.length, operation });
      if (!hasMore) return collected;
      throw new YoutrackCapError({ message: `YouTrack returned more than ${maxItems} entries while trying to ${operation}. Narrow the request.`, maxItems });
    }
  }
}

async function hasEntryAt({ auth, path, query, skip, operation }: { auth: unknown; path: string; query?: Record<string, QueryValue>; skip: number; operation: string }): Promise<boolean> {
  const page = await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path,
    query: { ...query, $top: 1, $skip: skip },
    operation,
  });
  return records(page).length > 0;
}

class YoutrackCapError extends Error {
  readonly maxItems: number;

  constructor({ message, maxItems }: { message: string; maxItems: number }) {
    super(message);
    this.name = 'YoutrackCapError';
    this.maxItems = maxItems;
  }
}

function positiveInteger({ value, label }: { value: unknown; label: string }): number {
  const parsed = integerOf(value);
  if (parsed === undefined || parsed < 1) {
    throw new Error(`${label} must be a whole number of at least 1. Got "${String(value).slice(0, 40)}".`);
  }
  return parsed;
}

function nonNegativeInteger({ value, label }: { value: unknown; label: string }): number {
  const parsed = integerOf(value);
  if (parsed === undefined || parsed < 0) {
    throw new Error(`${label} must be a whole number of 0 or more. Got "${String(value).slice(0, 40)}".`);
  }
  return parsed;
}

function integerOf(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isInteger(value) ? value : undefined;
  if (typeof value === 'string' && /^\s*-?\d+\s*$/.test(value)) return Number(value.trim());
  return undefined;
}

function boundedLimit({ value, fallback, max }: { value: unknown; fallback: number; max: number }): number {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = positiveInteger({ value, label: 'Limit' });
  if (parsed > max) {
    throw new Error(`Limit must be ${max} or less. Use Skip to read the next page.`);
  }
  return parsed;
}

function resolveDownloadUrl({ baseUrl, url }: { baseUrl: string; url: string }): { url: string; sameOrigin: boolean } {
  const base = new URL(baseUrl);
  const prefix = base.pathname.replace(/\/+$/, '');
  if (url.startsWith('/') && !url.startsWith('//')) {
    const path = prefix !== '' && (url === prefix || url.startsWith(`${prefix}/`)) ? url : `${prefix}${url}`;
    const resolved = classifyTarget({ baseUrl, target: parseTarget({ url: `${base.origin}${path}`, relativeTo: base.origin }) });
    if (!resolved.sameOrigin) {
      throw new Error('YouTrack returned an attachment URL that leaves the instance path; refusing to download it.');
    }
    return resolved;
  }
  return classifyTarget({ baseUrl, target: parseTarget({ url, relativeTo: base.origin }) });
}

function parseTarget({ url, relativeTo }: { url: string; relativeTo: string }): URL {
  try {
    return new URL(url, relativeTo);
  } catch {
    throw new Error(`YouTrack returned an attachment URL that is not valid: "${url.slice(0, 100)}".`);
  }
}

function classifyTarget({ baseUrl, target }: { baseUrl: string; target: URL }): { url: string; sameOrigin: boolean } {
  if (target.protocol !== 'https:' && target.protocol !== 'http:') {
    throw new Error(`YouTrack returned an attachment URL with an unsupported scheme (${target.protocol}).`);
  }
  if (target.username !== '' || target.password !== '') {
    throw new Error('YouTrack returned an attachment URL that carries credentials; refusing to download it.');
  }
  const base = new URL(baseUrl);
  const prefix = base.pathname.replace(/\/+$/, '');
  const samePath = prefix === '' || target.pathname === prefix || target.pathname.startsWith(`${prefix}/`);
  return { url: target.toString(), sameOrigin: target.origin === base.origin && samePath };
}

async function download({ auth, url, timeoutMs, operation }: { auth: unknown; url: string; timeoutMs?: number; operation: string }): Promise<{ data: Buffer; contentType: string | undefined }> {
  const { baseUrl, token } = connectionOf(auth);
  const timeout = timeoutMs ?? TRANSFER_TIMEOUT_MS;
  const deadline = Date.now() + timeout;
  const dispatcher = await verifiedTls();
  let hop = resolveDownloadUrl({ baseUrl, url });
  try {
    for (let redirects = 0; ; redirects++) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        throw new Error(`YouTrack could not ${operation}: the download did not finish in time.`);
      }
      const headers: Record<string, string> = { Accept: '*/*' };
      if (hop.sameOrigin) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await httpClient.sendRequest<unknown>(
        {
          method: HttpMethod.GET,
          url: hop.url,
          headers,
          timeout: remaining,
          retries: 0,
          responseType: 'stream',
          followRedirects: false,
          redactBodyInErrors: true,
        },
        { dispatcher }
      );
      if (response.status >= 300) {
        discard(response.body);
        const location = optionalText(response.headers?.['location']);
        if (!REDIRECT_STATUSES.has(response.status) || location === undefined) {
          throw redirectError({ status: response.status, location, baseUrl, operation });
        }
        if (redirects >= MAX_REDIRECTS) {
          throw new Error(`YouTrack could not ${operation}: more than ${MAX_REDIRECTS} redirects.`);
        }
        hop = classifyTarget({ baseUrl, target: parseTarget({ url: location, relativeTo: hop.url }) });
        continue;
      }
      const contentType = optionalText(response.headers?.['content-type']);
      const data = await readStream({ body: response.body, deadline, operation });
      return { data, contentType };
    }
  } catch (error) {
    throw translateError({ error, baseUrl, operation, timeout });
  }
}

function discard(body: unknown): void {
  if (body instanceof Readable) {
    body.destroy();
  }
}

async function readStream({ body, deadline, operation }: { body: unknown; deadline: number; operation: string }): Promise<Buffer> {
  if (Buffer.isBuffer(body)) return body;
  if (!(body instanceof Readable)) {
    throw new Error(`YouTrack could not ${operation}: the server returned no file content.`);
  }
  const remaining = Math.max(deadline - Date.now(), 1);
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const timer = setTimeout(() => {
      body.destroy();
      reject(new Error(`YouTrack could not ${operation}: the download did not finish in time.`));
    }, remaining);
    body.on('data', (chunk: unknown) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    });
    body.on('error', (error: unknown) => {
      clearTimeout(timer);
      reject(error);
    });
    body.on('end', () => {
      clearTimeout(timer);
      resolve(Buffer.concat(chunks));
    });
  });
}

function parseDate({ value, label }: { value: unknown; label: string }): number | undefined {
  const text = optionalText(value);
  if (text === undefined) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (match === null) {
    throw new Error(`${label} must be a date in the form YYYY-MM-DD, like 2026-12-01. Got "${text.slice(0, 40)}".`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const epoch = Date.UTC(year, month - 1, day);
  const check = new Date(epoch);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    throw new Error(`${label} is not a real calendar date: "${text}".`);
  }
  return epoch;
}

function parseDateOrDateTime({ value, label }: { value: unknown; label: string }): number | undefined {
  const text = optionalText(value);
  if (text === undefined) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return parseDate({ value: text, label });
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.test(text)) {
    throw new Error(`${label} must be a date (YYYY-MM-DD) or an ISO-8601 date-time with a time zone, like 2026-12-01T09:30:00Z or 2026-12-01T09:30:00+02:00. Got "${text.slice(0, 60)}".`);
  }
  const epoch = Date.parse(text);
  if (Number.isNaN(epoch)) {
    throw new Error(`${label} is not a real date-time: "${text}".`);
  }
  return epoch;
}

function matchesSearchText({ row, text, keys }: { row: Record<string, unknown>; text: string | undefined; keys: string[] }): boolean {
  const terms = (text ?? '').toLowerCase().split(/\s+/).filter((term) => term.length > 0);
  if (terms.length === 0) return true;
  const haystacks = keys.map((key) => row[key]).filter((value): value is string => typeof value === 'string').map((value) => value.toLowerCase());
  return terms.some((term) => haystacks.some((haystack) => haystack.includes(term)));
}

export { YoutrackApiError, YoutrackCapError };

export const youtrackClient = {
  request,
  send,
  listPage,
  searchPage,
  listAll,
  listUpTo,
  lenientLimit,
  download,
  resolveDownloadUrl,
  checkBaseUrl,
  normalizeBaseUrl,
  baseUrlOf,
  connectionOf,
  segment,
  isDatabaseId,
  isRecord,
  records,
  recordOf,
  optionalText,
  textOrNull,
  numberOrNull,
  booleanOrNull,
  positiveInteger,
  nonNegativeInteger,
  boundedLimit,
  parseDate,
  parseDateOrDateTime,
  matchesSearchText,
  vendorMessage,
  verifiedTls,
  TRANSFER_TIMEOUT_MS,
  SEARCH_MAX_ROWS,
};

type QueryValue = string | number | boolean | undefined | null;

type SendParams = {
  baseUrl: string;
  token: string;
  method: HttpMethod;
  path: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  responseType?: 'json' | 'text';
  operation: string;
};

type RequestParams = Omit<SendParams, 'baseUrl' | 'token'> & {
  auth: unknown;
};

type ListPageParams = {
  auth: unknown;
  path: string;
  query?: Record<string, QueryValue>;
  limit: unknown;
  skip?: unknown;
  operation: string;
};

type SearchPageParams = {
  auth: unknown;
  path: string;
  query?: Record<string, QueryValue>;
  limit: unknown;
  skip?: unknown;
  matches: (row: Record<string, unknown>) => boolean;
  operation: string;
};

type ListUpToParams = {
  auth: unknown;
  path: string;
  query?: Record<string, QueryValue>;
  limit: unknown;
  fallback: number;
  skip?: unknown;
  operation: string;
};

type ListAllParams = {
  auth: unknown;
  path: string;
  query?: Record<string, QueryValue>;
  maxItems: number;
  pageSize?: number;
  skip?: number;
  operation: string;
};
