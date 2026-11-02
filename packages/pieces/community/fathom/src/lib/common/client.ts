import { httpClient, HttpMethod, HttpResponse } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { FathomAuthValue } from './auth';

const FATHOM_BASE_URL = 'https://api.fathom.ai/external/v1';
const RATE_LIMIT_WAITS_MS = [10000, 20000];
const REQUEST_TIMEOUT_MS = 60000;

export class FathomApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({ status, message, responseBody }: { status: number; message: string; responseBody: unknown }) {
    super(message);
    this.name = 'FathomApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function vendorDetail(body: unknown): string {
  if (isRecord(body)) {
    for (const key of ['message', 'error', 'detail', 'errors']) {
      const value = body[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return withoutTrailingPeriods({ text: value.trim().slice(0, 300) });
      }
      if (Array.isArray(value) && value.length > 0) {
        return JSON.stringify(value).slice(0, 300);
      }
    }
    return JSON.stringify(body).slice(0, 300);
  }
  if (typeof body === 'string' && body.trim().length > 0) {
    return withoutTrailingPeriods({ text: body.trim().slice(0, 300) });
  }
  return 'no details returned';
}

function withoutTrailingPeriods({ text }: { text: string }): string {
  let end = text.length;
  while (end > 0 && text[end - 1] === '.') {
    end--;
  }
  return text.slice(0, end);
}

function fathomErrorMessage({ status, responseBody }: { status: number; responseBody: unknown }): string {
  const detail = vendorDetail(responseBody);
  switch (status) {
    case 400:
      return `Fathom rejected the request (400): ${detail}. Check the values you entered (dates as ISO 8601, exact team and meeting type names).`;
    case 401:
      return `Fathom did not accept the connection (401): ${detail}. Reconnect your Fathom account or generate a new API key.`;
    case 403:
      return `Fathom refused access (403): ${detail}. The connected Fathom user lacks permission for this data: listing users needs an account admin, and limited-access shares cannot be downloaded.`;
    case 404:
      return `Fathom could not find it (404): ${detail}. Check the recording or download ID.`;
    case 422:
      return `Fathom could not process the request (422): ${detail}. Only recordings with video or audio can be downloaded.`;
    case 429:
      return `Fathom rate limit reached (429): ${detail}. Fathom allows about 60 requests per minute (fewer for summaries and transcripts); wait a minute and try again.`;
    default:
      return `Fathom request failed with HTTP ${status}: ${detail}.`;
  }
}

function authHeaders(auth: FathomAuthValue): Record<string, string> {
  if (auth.type === AppConnectionType.SECRET_TEXT) {
    return { 'X-Api-Key': auth.secret_text.trim() };
  }
  return { Authorization: `Bearer ${auth.access_token}` };
}

function assertRelativePath(path: string): void {
  if (path.length === 0 || path.startsWith('/') || path.includes('://') || path.includes('..') || path.includes('\\') || path.includes('?') || path.includes('#')) {
    throw new Error(`Refusing to call an unexpected Fathom path: "${path}".`);
  }
}

function buildQueryString(query: Record<string, QueryValue>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(`${key}[]`, item);
      }
      continue;
    }
    params.append(key, String(value));
  }
  const text = params.toString();
  return text.length > 0 ? `?${text}` : '';
}

function statusOf(error: unknown): { status: number; responseBody: unknown } | undefined {
  const response = isRecord(error) && isRecord(error['response']) ? error['response'] : undefined;
  const status = response?.['status'];
  if (typeof status !== 'number') {
    return undefined;
  }
  return { status, responseBody: response?.['body'] };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request<T>({
  auth,
  method,
  path,
  query,
  body,
}: {
  auth: FathomAuthValue;
  method: HttpMethod;
  path: string;
  query?: Record<string, QueryValue>;
  body?: Record<string, unknown>;
}): Promise<HttpResponse<T>> {
  assertRelativePath(path);
  const url = `${FATHOM_BASE_URL}/${path}${buildQueryString(query ?? {})}`;
  for (let attempt = 0; ; attempt++) {
    try {
      return await httpClient.sendRequest<T>({
        method,
        url,
        headers: { ...authHeaders(auth), Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
        body,
        timeout: REQUEST_TIMEOUT_MS,
      });
    } catch (error) {
      const failure = statusOf(error);
      if (failure === undefined) {
        throw error;
      }
      if (failure.status === 429 && attempt < RATE_LIMIT_WAITS_MS.length) {
        await wait(RATE_LIMIT_WAITS_MS[attempt]);
        continue;
      }
      throw new FathomApiError({ ...failure, message: fathomErrorMessage(failure) });
    }
  }
}

async function requestObject({
  auth,
  method,
  path,
  query,
  body,
}: Parameters<typeof request>[0]): Promise<Record<string, unknown>> {
  const response = await request<unknown>({ auth, method, path, query, body });
  if (!isRecord(response.body)) {
    throw new Error(`Fathom returned an unexpected response for ${path}: ${JSON.stringify(response.body ?? null).slice(0, 200)}`);
  }
  return response.body;
}

async function listPage({
  auth,
  path,
  query,
}: {
  auth: FathomAuthValue;
  path: string;
  query?: Record<string, QueryValue>;
}): Promise<FathomPage> {
  const body = await requestObject({ auth, method: HttpMethod.GET, path, query });
  const items = Array.isArray(body['items']) ? body['items'].filter(isRecord) : [];
  const cursor = body['next_cursor'];
  const limit = body['limit'];
  return {
    items,
    next_cursor: typeof cursor === 'string' && cursor.length > 0 ? cursor : null,
    limit: typeof limit === 'number' ? limit : null,
  };
}

async function listPages({
  auth,
  path,
  query,
  maxPages,
  stopWhen,
}: {
  auth: FathomAuthValue;
  path: string;
  query?: Record<string, QueryValue>;
  maxPages: number;
  stopWhen?: (items: Record<string, unknown>[]) => boolean;
}): Promise<{ items: Record<string, unknown>[]; truncated: boolean; pages: number }> {
  const items: Record<string, unknown>[] = [];
  let cursor: string | undefined = undefined;
  for (let pages = 1; pages <= maxPages; pages++) {
    const page: FathomPage = await listPage({ auth, path, query: { ...query, cursor } });
    items.push(...page.items);
    if (page.next_cursor === null || (stopWhen !== undefined && stopWhen(page.items))) {
      return { items, truncated: false, pages };
    }
    cursor = page.next_cursor;
  }
  return { items, truncated: true, pages: maxPages };
}

export const fathomClient = {
  baseUrl: FATHOM_BASE_URL,
  request,
  requestObject,
  listPage,
  listPages,
  authHeaders,
  isRecord,
  errorMessage: fathomErrorMessage,
  buildQueryString,
};

export type QueryValue = string | number | boolean | string[] | undefined;
export type FathomPage = { items: Record<string, unknown>[]; next_cursor: string | null; limit: number | null };
