import { httpClient, HttpMethod, HttpResponse } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/pieces-framework';
import type { NuelinkAuthValue } from '../auth';

export class NuelinkApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({ status, message, responseBody }: { status: number; message: string; responseBody: unknown }) {
    super(message);
    this.name = 'NuelinkApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

export const nuelinkClient = {
  apiKeyOf,
  legacyTokenOf,
  numericId,
  bodyId,
  request,
  getPage,
  listAllPages,
  findBrand,
  legacyCreatePost,
  validateApiKey,
  validateLegacyToken,
  describeError,
  isRecord,
};

function apiKeyOf({ auth }: { auth: NuelinkAuthValue | undefined }): string {
  if (auth !== undefined && auth.type === AppConnectionType.CUSTOM_AUTH) {
    const key = auth.props.apiKey;
    if (typeof key === 'string' && key.trim().length > 0) {
      return key.trim();
    }
  }
  throw new Error(
    'This action needs a Nuelink API Key connection. Automation tokens only work with Create Post. Add a connection of type "API Key" (Nuelink Settings → API → Generate API key) and select it in this step.'
  );
}

function legacyTokenOf({ auth }: { auth: NuelinkAuthValue | undefined }): string {
  if (auth !== undefined && auth.type === AppConnectionType.SECRET_TEXT && auth.secret_text.trim().length > 0) {
    return auth.secret_text.trim();
  }
  throw new Error('Create Post needs an Automation Token connection. With an API Key connection, use Create Post in Collection instead.');
}

function numericId({ value, label }: { value: unknown; label: string }): string {
  const text = typeof value === 'number' && Number.isSafeInteger(value) ? String(value) : typeof value === 'string' ? value.trim() : '';
  if (!/^[1-9]\d{0,17}$/.test(text)) {
    throw new Error(`${label} must be a numeric Nuelink ID, for example 8801.`);
  }
  return text;
}

function bodyId({ value, label }: { value: unknown; label: string }): number {
  const text = typeof value === 'number' ? (Number.isInteger(value) ? String(value) : '') : typeof value === 'string' ? value.trim() : '';
  if (!/^[1-9]\d{0,17}$/.test(text)) {
    throw new Error(`${label} must be a numeric Nuelink ID, for example 8801.`);
  }
  const number = Number(text);
  if (!Number.isSafeInteger(number)) {
    throw new Error(`${label} ${text} is too large to send safely; Nuelink IDs this large are not supported by this step.`);
  }
  return number;
}

async function request({
  apiKey,
  method,
  path,
  query,
  body,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  timeoutHint,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string[];
  query?: Record<string, QueryValue>;
  body?: Record<string, unknown> | FormData;
  timeoutMs?: number;
  timeoutHint?: string;
}): Promise<unknown> {
  const url = `${API_BASE_URL}/${safePath({ path })}`;
  const response = await send({ url, method, token: apiKey, query, body, timeoutMs, timeoutHint, unauthorizedHint: API_KEY_HINT });
  return dataOf({ body: response.body, status: response.status });
}

async function getPage({
  apiKey,
  path,
  query,
  page,
  perPage,
}: {
  apiKey: string;
  path: string[];
  query?: Record<string, QueryValue>;
  page: number;
  perPage: number;
}): Promise<ListPage> {
  const url = `${API_BASE_URL}/${safePath({ path })}`;
  const response = await send({
    url,
    method: HttpMethod.GET,
    token: apiKey,
    query: { ...(query ?? {}), page, per_page: perPage },
    timeoutMs: DEFAULT_TIMEOUT_MS,
    unauthorizedHint: API_KEY_HINT,
  });
  const items = dataOf({ body: response.body, status: response.status });
  if (!Array.isArray(items)) {
    throw new Error('Nuelink returned an unexpected list response (no data array).');
  }
  const pagination = paginationOf({ body: response.body, fallbackPage: page, fallbackPerPage: perPage, itemCount: items.length });
  return {
    items: items.filter(isRecord),
    page: pagination.currentPage,
    perPage: pagination.perPage,
    total: pagination.total,
    lastPage: pagination.lastPage,
    hasMore: pagination.currentPage < pagination.lastPage,
  };
}

async function listAllPages({
  apiKey,
  path,
  query,
  maxPages = MAX_DROPDOWN_PAGES,
}: {
  apiKey: string;
  path: string[];
  query?: Record<string, QueryValue>;
  maxPages?: number;
}): Promise<{ items: Record<string, unknown>[]; truncated: boolean }> {
  const pages: Record<string, unknown>[][] = [];
  for (let page = 1; page <= maxPages; page++) {
    const result = await getPage({ apiKey, path, query, page, perPage: MAX_PER_PAGE });
    pages.push(result.items);
    if (!result.hasMore) {
      return { items: pages.flat(), truncated: false };
    }
  }
  return { items: pages.flat(), truncated: true };
}

async function findBrand({ apiKey, brandId }: { apiKey: string; brandId: string }): Promise<BrandRecord> {
  const { items } = await listAllPages({ apiKey, path: ['brands'] });
  const brand = items.find((item) => String(item['id']) === brandId);
  if (brand === undefined) {
    throw new Error(`Brand ${brandId} is not one of the brands this Nuelink API key can access.`);
  }
  return {
    id: brandId,
    title: typeof brand['title'] === 'string' ? brand['title'] : `Brand ${brandId}`,
    timezone: typeof brand['timezone'] === 'string' ? brand['timezone'] : null,
  };
}

async function legacyCreatePost({ token, body }: { token: string; body: Record<string, unknown> }): Promise<unknown> {
  const response = await send({
    url: `${LEGACY_BASE_URL}/pabbly`,
    method: HttpMethod.POST,
    token,
    body,
    timeoutMs: CREATE_TIMEOUT_MS,
    timeoutHint: CREATE_TIMEOUT_HINT,
    unauthorizedHint: LEGACY_TOKEN_HINT,
  });
  if (isRecord(response.body) && response.body['status'] === 'error') {
    throw new NuelinkApiError({
      status: response.status,
      responseBody: response.body,
      message: describeError({ status: 400, responseBody: response.body, unauthorizedHint: LEGACY_TOKEN_HINT }),
    });
  }
  return response.body;
}

async function validateApiKey({ apiKey }: { apiKey: unknown }): Promise<ValidationResult> {
  const key = typeof apiKey === 'string' ? apiKey.trim() : '';
  if (key.length === 0) {
    return { valid: false, error: 'Enter the API key from Nuelink Settings → API.' };
  }
  return validateToken({
    url: `${API_BASE_URL}/auth`,
    token: key,
    invalidMessage: 'Nuelink did not accept this API key. It may be mistyped or expired (keys last 30 days to 1 year). Generate a new one in Nuelink Settings → API.',
    what: 'API key',
  });
}

async function validateLegacyToken({ token }: { token: unknown }): Promise<ValidationResult> {
  const value = typeof token === 'string' ? token.trim() : '';
  if (value.length === 0) {
    return { valid: false, error: 'Enter the automation token from your Nuelink automation.' };
  }
  return validateToken({
    url: `${LEGACY_BASE_URL}/user`,
    token: value,
    invalidMessage: 'Nuelink did not accept this automation token. Copy it again from your Nuelink automation, or create a new automation for Activepieces.',
    what: 'automation token',
  });
}

function describeError({ status, responseBody, unauthorizedHint = API_KEY_HINT }: { status: number; responseBody: unknown; unauthorizedHint?: string }): string {
  const detail = vendorDetail({ body: responseBody });
  switch (status) {
    case 400:
      return `Nuelink rejected the request (400): ${detail}. If a media URL is involved, check that it opens without a login.`;
    case 401:
      return `Nuelink did not accept the connection (401): ${detail}. ${unauthorizedHint}`;
    case 403:
      return `Nuelink refused the request (403): ${detail}. ${forbiddenHint({ responseBody })}`;
    case 404:
      return `Nuelink could not find it (404): ${detail}. Check the brand, collection, channel or post ID, and that the API key's user is a member of the brand.`;
    case 409:
      return `Nuelink refused the change (409): ${detail}. Published posts can no longer be edited.`;
    case 422:
      return `Nuelink rejected the values (422): ${detail}.`;
    case 429:
      return `Nuelink rate limit reached (429): ${detail}. Nuelink allows 30 requests a minute per user across all of that user's keys; wait a minute and try again.`;
    default:
      if (status >= 500) {
        return `Nuelink had a server error (HTTP ${status}): ${detail}. Try again later.`;
      }
      return `Nuelink request failed (HTTP ${status}): ${detail}.`;
  }
}

async function validateToken({ url, token, invalidMessage, what }: { url: string; token: string; invalidMessage: string; what: string }): Promise<ValidationResult> {
  try {
    await send({ url, method: HttpMethod.GET, token, timeoutMs: VALIDATE_TIMEOUT_MS, unauthorizedHint: '' });
    return { valid: true };
  } catch (error) {
    if (error instanceof NuelinkApiError && (error.status === 401 || error.status === 403)) {
      return { valid: false, error: invalidMessage };
    }
    const status = error instanceof NuelinkApiError ? ` (HTTP ${error.status})` : '';
    return { valid: false, error: `Could not reach Nuelink to check the ${what}${status}. Try again in a minute.` };
  }
}

async function send({
  url,
  method,
  token,
  query,
  body,
  timeoutMs,
  timeoutHint,
  unauthorizedHint,
}: {
  url: string;
  method: HttpMethod;
  token: string;
  query?: Record<string, QueryValue>;
  body?: Record<string, unknown> | FormData;
  timeoutMs: number;
  timeoutHint?: string;
  unauthorizedHint: string;
}): Promise<HttpResponse<unknown>> {
  const dispatcher = await verifiedTls();
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  try {
    const response = await httpClient.sendRequest<unknown>(
      {
        method,
        url,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': body === undefined || isForm ? undefined : 'application/json',
        },
        queryParams: toQueryParams({ query }),
        body,
        timeout: timeoutMs,
        followRedirects: false,
      },
      { dispatcher }
    );
    if (response.status >= 300) {
      throw new NuelinkApiError({
        status: response.status,
        responseBody: undefined,
        message: `Nuelink answered with an unexpected redirect (HTTP ${response.status}). The request was not followed so your credentials stay on ${new URL(url).host}.`,
      });
    }
    return response;
  } catch (error) {
    if (error instanceof NuelinkApiError) {
      throw error;
    }
    if (isTimeout({ error })) {
      throw new Error(`Nuelink did not answer within ${Math.round(timeoutMs / 1000)} seconds.${timeoutHint === undefined ? '' : ` ${timeoutHint}`}`);
    }
    const failure = failureOf({ error });
    if (failure === undefined) {
      throw error;
    }
    throw new NuelinkApiError({
      status: failure.status,
      responseBody: failure.responseBody,
      message: describeError({ status: failure.status, responseBody: failure.responseBody, unauthorizedHint }),
    });
  }
}

function verifiedTls(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici')
    .then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }))
    .catch((error: unknown) => {
      verifiedTlsAgent = undefined;
      throw error;
    });
  return verifiedTlsAgent;
}

function safePath({ path }: { path: string[] }): string {
  if (path.length === 0 || path.some((segment) => !/^(?:[a-z][a-z-]*|[1-9]\d{0,17})$/.test(segment))) {
    throw new Error(`Refusing to call an unexpected Nuelink path: /${path.join('/')}`);
  }
  return path.join('/');
}

function toQueryParams({ query }: { query: Record<string, QueryValue> | undefined }): Record<string, string> {
  const entries = Object.entries(query ?? {}).flatMap(([key, value]) => (value === undefined ? [] : [[key, String(value)]]));
  return Object.fromEntries(entries);
}

function dataOf({ body, status }: { body: unknown; status: number }): unknown {
  if (!isRecord(body)) {
    throw new Error(`Nuelink returned an unexpected response (HTTP ${status}, no JSON body).`);
  }
  if (body['status'] === 'error') {
    throw new NuelinkApiError({ status, responseBody: body, message: describeError({ status: 400, responseBody: body }) });
  }
  if (!('data' in body)) {
    throw new Error(`Nuelink returned an unexpected response (HTTP ${status}, no data field).`);
  }
  return body['data'];
}

function paginationOf({
  body,
  fallbackPage,
  fallbackPerPage,
  itemCount,
}: {
  body: unknown;
  fallbackPage: number;
  fallbackPerPage: number;
  itemCount: number;
}): { currentPage: number; perPage: number; total: number; lastPage: number } {
  const pagination = isRecord(body) && isRecord(body['pagination']) ? body['pagination'] : undefined;
  const numberOr = ({ value, fallback }: { value: unknown; fallback: number }) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);
  const currentPage = numberOr({ value: pagination?.['currentPage'], fallback: fallbackPage });
  return {
    currentPage,
    perPage: numberOr({ value: pagination?.['perPage'], fallback: fallbackPerPage }),
    total: numberOr({ value: pagination?.['total'], fallback: itemCount }),
    lastPage: numberOr({ value: pagination?.['lastPage'], fallback: currentPage }),
  };
}

function vendorDetail({ body }: { body: unknown }): string {
  if (isRecord(body)) {
    const errors = body['errors'];
    const fieldMessages = isRecord(errors)
      ? Object.entries(errors).flatMap(([field, value]) => messagesOf({ value }).map((message) => `${field}: ${message}`))
      : [];
    if (fieldMessages.length > 0) {
      return clip({ text: fieldMessages.join('; ') });
    }
    const message = body['message'];
    if (typeof message === 'string' && message.trim().length > 0) {
      return clip({ text: message.trim() });
    }
    return clip({ text: JSON.stringify(body) });
  }
  if (typeof body === 'string' && body.trim().length > 0) {
    return clip({ text: body.trim() });
  }
  return 'no details returned';
}

function messagesOf({ value }: { value: unknown }): string[] {
  if (typeof value === 'string') {
    return value.trim().length > 0 ? [value.trim()] : [];
  }
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim());
  }
  return [];
}

function clip({ text }: { text: string }): string {
  const short = text.length > MAX_DETAIL_LENGTH ? `${text.slice(0, MAX_DETAIL_LENGTH)}…` : text;
  let end = short.length;
  while (end > 0 && short[end - 1] === '.') {
    end--;
  }
  return short.slice(0, end);
}

function forbiddenHint({ responseBody }: { responseBody: unknown }): string {
  const errors = isRecord(responseBody) && isRecord(responseBody['errors']) ? responseBody['errors'] : {};
  if ('permissions' in errors) {
    return 'The Nuelink account owner must turn on "Allow AI to perform sensitive actions" in Nuelink Settings → API.';
  }
  if ('limits' in errors) {
    return 'A Nuelink plan or brand limit was reached; free up space or upgrade the plan.';
  }
  return "Check that the API key's user is a member of this brand.";
}

function failureOf({ error }: { error: unknown }): { status: number; responseBody: unknown } | undefined {
  if (!isRecord(error)) {
    return undefined;
  }
  const response = error['response'];
  if (!isRecord(response) || typeof response['status'] !== 'number') {
    return undefined;
  }
  return { status: response['status'], responseBody: response['body'] };
}

function isTimeout({ error }: { error: unknown }): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

let verifiedTlsAgent: Promise<unknown> | undefined;

const API_BASE_URL = 'https://app.nuelink.com/api/public/v1';
const LEGACY_BASE_URL = 'https://nuelink.com/api/v1';

const DEFAULT_TIMEOUT_MS = 30_000;
const VALIDATE_TIMEOUT_MS = 15_000;
const CREATE_TIMEOUT_MS = 120_000;
const MAX_PER_PAGE = 100;
const MAX_DROPDOWN_PAGES = 10;
const MAX_DETAIL_LENGTH = 500;
const API_KEY_HINT = 'API keys expire after 30 days to 1 year. Generate a new key in Nuelink Settings → API and update the connection.';
const LEGACY_TOKEN_HINT = 'Copy the automation token again from your Nuelink automation, or create a new automation for Activepieces and update the connection.';
const CREATE_TIMEOUT_HINT = 'The post may still have been created. Check Nuelink before running this step again, so the post is not published twice.';

export const NUELINK_LIMITS = {
  createTimeoutMs: CREATE_TIMEOUT_MS,
  uploadTimeoutMs: 300_000,
  createTimeoutHint: CREATE_TIMEOUT_HINT,
  maxPerPage: MAX_PER_PAGE,
};

type QueryValue = string | number | undefined;

type ValidationResult = { valid: true } | { valid: false; error: string };

export type ListPage = {
  items: Record<string, unknown>[];
  page: number;
  perPage: number;
  total: number;
  lastPage: number;
  hasMore: boolean;
};

export type BrandRecord = {
  id: string;
  title: string;
  timezone: string | null;
};
