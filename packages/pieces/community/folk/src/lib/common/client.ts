import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import type { folkAuth } from './auth';

const BASE_URL = 'https://api.folk.app';
const MAX_RATE_LIMIT_RETRIES = 2;
const MAX_RETRY_WAIT_MS = 10_000;
const DEFAULT_RETRY_WAIT_MS = 2_000;
const DROPDOWN_PAGE_LIMIT = 20;
const DROPDOWN_PAGE_DELAY_MS = 150;
let verifiedTlsAgent: Promise<unknown> | undefined;

export class FolkApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string | undefined,
    public readonly responseBody: unknown
  ) {
    super(message);
    this.name = 'FolkApiError';
  }
}

function readHttpFailure(error: unknown): { status: number; body: unknown } | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }
  const response: unknown = Reflect.get(error, 'response');
  if (typeof response !== 'object' || response === null) {
    return null;
  }
  const status: unknown = Reflect.get(response, 'status');
  if (typeof status !== 'number') {
    return null;
  }
  return { status, body: Reflect.get(response, 'body') };
}

function vendorError(body: unknown): { code?: string; message?: string; retryAfter?: string } {
  if (typeof body !== 'object' || body === null) {
    return {};
  }
  const error: unknown = Reflect.get(body, 'error');
  if (typeof error !== 'object' || error === null) {
    return {};
  }
  const code: unknown = Reflect.get(error, 'code');
  const message: unknown = Reflect.get(error, 'message');
  const details: unknown = Reflect.get(error, 'details');
  const retryAfter: unknown =
    typeof details === 'object' && details !== null ? Reflect.get(details, 'retryAfter') : undefined;
  return {
    code: typeof code === 'string' ? code : undefined,
    message: typeof message === 'string' ? message : undefined,
    retryAfter: typeof retryAfter === 'string' ? retryAfter : undefined,
  };
}

function retryWaitMs({ retryAfter, now }: { retryAfter: string | undefined; now: number }): number {
  if (!retryAfter) {
    return DEFAULT_RETRY_WAIT_MS;
  }
  const at = Date.parse(retryAfter);
  if (Number.isNaN(at)) {
    return DEFAULT_RETRY_WAIT_MS;
  }
  return Math.min(Math.max(at - now, 0), MAX_RETRY_WAIT_MS);
}

function toFolkError({ status, body }: { status: number; body: unknown }): FolkApiError {
  const { code, message } = vendorError(body);
  const prefix = STATUS_HINTS[status] ?? `Folk API request failed (HTTP ${status}).`;
  return new FolkApiError(message ? `${prefix} ${message}` : prefix, status, code, body);
}

const STATUS_HINTS: Record<number, string> = {
  400: 'Folk rejected the request (HTTP 400).',
  401: 'Folk rejected the API key (HTTP 401). Check the key in the connection.',
  402: 'Your Folk workspace is out of credits or the plan does not allow this (HTTP 402).',
  403: 'The Folk API key is not allowed to do this (HTTP 403).',
  404: 'Folk could not find that record (HTTP 404). Check the ID.',
  409: 'Folk reported a conflict (HTTP 409).',
  422: 'Folk could not process the input (HTTP 422).',
  429: 'Folk rate limit reached (HTTP 429). Try again in a few seconds.',
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request<T>({
  auth,
  method,
  path,
  query,
  body,
  idempotencyKey,
}: {
  auth: FolkAuthValue;
  method: HttpMethod;
  path: string;
  query?: QueryParams;
  body?: FolkBody;
  idempotencyKey?: string;
}): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${auth.secret_text.trim()}`,
    Accept: 'application/json',
  };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await httpClient.sendRequest<T>(
        {
          method,
          url: `${BASE_URL}${path}`,
          headers,
          queryParams: query,
          body,
          redactBodyInErrors: true,
        },
        { dispatcher: await verifiedTls() }
      );
      return response.body;
    } catch (error) {
      const failure = readHttpFailure(error);
      if (!failure) {
        throw error;
      }
      if (failure.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
        await sleep(retryWaitMs({ retryAfter: vendorError(failure.body).retryAfter, now: Date.now() }));
        continue;
      }
      throw toFolkError({ status: failure.status, body: failure.body });
    }
  }
}

function verifiedTls(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
  return verifiedTlsAgent;
}

function cursorFromNextLink({ nextLink }: { nextLink: string | undefined | null }): string | undefined {
  if (!nextLink) {
    return undefined;
  }
  try {
    const cursor = new URL(nextLink, BASE_URL).searchParams.get('cursor');
    return cursor ? cursor : undefined;
  } catch {
    return undefined;
  }
}

async function listPage<T>({
  auth,
  path,
  query,
  limit,
  cursor,
}: {
  auth: FolkAuthValue;
  path: string;
  query?: QueryParams;
  limit?: number;
  cursor?: string;
}): Promise<FolkPage<T>> {
  const params: QueryParams = { ...(query ?? {}) };
  if (limit !== undefined) {
    params['limit'] = String(limit);
  }
  if (cursor) {
    params['cursor'] = cursor;
  }
  const response = await request<FolkListResponse<T>>({
    auth,
    method: HttpMethod.GET,
    path,
    query: params,
  });
  const items = response.data?.items ?? [];
  const nextLink = response.data?.pagination?.nextLink ?? null;
  const nextCursor = cursorFromNextLink({ nextLink });
  return { items, count: items.length, hasMore: nextCursor !== undefined, nextCursor: nextCursor ?? null, nextLink };
}

async function listForDropdown<T>({
  auth,
  path,
  query,
  maxPages = DROPDOWN_PAGE_LIMIT,
}: {
  auth: FolkAuthValue;
  path: string;
  query?: QueryParams;
  maxPages?: number;
}): Promise<{ items: T[]; truncated: boolean }> {
  const items: T[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < maxPages; page++) {
    if (page > 0) {
      await sleep(DROPDOWN_PAGE_DELAY_MS);
    }
    const result = await listPage<T>({ auth, path, query, limit: 100, cursor });
    items.push(...result.items);
    if (!result.nextCursor) {
      return { items, truncated: false };
    }
    cursor = result.nextCursor;
  }
  return { items, truncated: true };
}

async function getData<T>({ auth, path }: { auth: FolkAuthValue; path: string }): Promise<T> {
  const response = await request<{ data: T }>({ auth, method: HttpMethod.GET, path });
  return response.data;
}

async function sendData<T>({
  auth,
  method,
  path,
  body,
  idempotencyKey,
}: {
  auth: FolkAuthValue;
  method: HttpMethod;
  path: string;
  body?: FolkBody;
  idempotencyKey?: string;
}): Promise<T> {
  const response = await request<{ data: T }>({ auth, method, path, body, idempotencyKey });
  return response.data;
}

function idSegment({ value, label }: { value: unknown; label: string }): string {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (trimmed.length === 0) {
    throw new Error(`${label} is required.`);
  }
  if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) {
    throw new Error(`${label} "${trimmed}" is not a valid Folk ID. It should look like per_..., com_..., grp_... or similar.`);
  }
  return encodeURIComponent(trimmed);
}

function nameSegment({ value, label }: { value: unknown; label: string }): string {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (trimmed.length === 0) {
    throw new Error(`${label} is required.`);
  }
  return encodeURIComponent(trimmed);
}

async function deleteWebhook({ auth, webhookId }: { auth: FolkAuthValue; webhookId: string }): Promise<void> {
  try {
    await request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/v1/webhooks/${idSegment({ value: webhookId, label: 'Webhook ID' })}`,
    });
  } catch (error) {
    if (error instanceof FolkApiError && error.status === 404) {
      return;
    }
    throw error;
  }
}

export const folkClient = {
  request,
  listPage,
  listForDropdown,
  getData,
  sendData,
  idSegment,
  nameSegment,
  cursorFromNextLink,
  retryWaitMs,
  deleteWebhook,
  verifiedTls,
  baseUrl: BASE_URL,
};

export type FolkAuthValue = AppConnectionValueForAuthProperty<typeof folkAuth>;

export type FolkPage<T> = {
  items: T[];
  count: number;
  hasMore: boolean;
  nextCursor: string | null;
  nextLink: string | null;
};

type FolkListResponse<T> = {
  data?: {
    items?: T[];
    pagination?: { nextLink?: string | null };
  };
};

export type FolkBody = Record<string, unknown>;
