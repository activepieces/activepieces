import { HttpError, HttpMethod, QueryParams, httpClient } from '@activepieces/pieces-common';
import { ZendeskAuthValue, getZendeskAuthentication, getZendeskBaseUrl } from './client';

async function request<T>(params: RequestParams): Promise<T> {
  const response = await send<T>(params);
  return response.body;
}

async function send<T>({ auth, method, path, queryParams, body }: RequestParams): Promise<{ status: number; body: T }> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${getZendeskBaseUrl(auth)}${path}`,
      authentication: getZendeskAuthentication(auth),
      queryParams,
      body,
    });
    return { status: response.status, body: response.body };
  } catch (error) {
    if (error instanceof HttpError) {
      throw new Error(describeError({ status: error.response.status, body: error.response.body }), { cause: error });
    }
    throw error;
  }
}

function optionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return value === true || value === 'true';
}

function id({ value, label }: { value: unknown; label: string }): string {
  const text = String(value ?? '').trim();
  if (!/^\d+$/.test(text)) {
    throw new Error(`${label} must be a numeric Zendesk ID, got "${text}".`);
  }
  return text;
}

function optionalId({ value, label }: { value: unknown; label: string }): number | undefined {
  if (value === undefined || value === null || String(value).trim() === '') {
    return undefined;
  }
  return Number(id({ value, label }));
}

function jsonArray({ value, label }: { value: unknown; label: string }): unknown[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be a JSON array.`);
  }
  return value;
}

function idList({ values, label, max }: { values: unknown; label: string; max: number }): string[] {
  const list = Array.isArray(values) ? values : [];
  const ids = list.map((value) => id({ value, label }));
  if (ids.length === 0) {
    throw new Error(`${label} must contain at least one ID.`);
  }
  if (ids.length > max) {
    throw new Error(`${label} accepts at most ${max} IDs per call, got ${ids.length}.`);
  }
  return ids;
}

function stringList(values: unknown): string[] {
  const list = Array.isArray(values) ? values : [];
  return list.map((value) => String(value).trim()).filter((value) => value.length > 0);
}

function cursorQuery({ limit, cursor }: { limit?: number; cursor?: string }): QueryParams {
  return {
    'page[size]': String(Math.min(Math.max(limit ?? 25, 1), 100)),
    ...(cursor ? { 'page[after]': cursor } : {}),
  };
}

function cursorResult(meta: CursorMeta | undefined): { has_more: boolean; next_cursor: string | null } {
  const hasMore = meta?.has_more ?? false;
  return { has_more: hasMore, next_cursor: hasMore ? meta?.after_cursor ?? null : null };
}

function query(values: Record<string, unknown>): QueryParams {
  return Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, String(value)]),
  );
}

function offsetQuery({ limit, page }: { limit?: number; page?: number }): QueryParams {
  return {
    per_page: String(Math.min(Math.max(limit ?? 25, 1), 100)),
    page: String(Math.max(page ?? 1, 1)),
  };
}

function offsetResult({ nextPage, page }: { nextPage: string | null | undefined; page?: number }): {
  has_more: boolean;
  next_page: number | null;
} {
  const hasMore = !!nextPage;
  return { has_more: hasMore, next_page: hasMore ? Math.max(page ?? 1, 1) + 1 : null };
}

function pathSegment({ value, label }: { value: unknown; label: string }): string {
  const text = String(value ?? '').trim();
  if (text.length === 0) {
    throw new Error(`${label} is required.`);
  }
  return encodeURIComponent(text);
}

function jsonObject({ value, label }: { value: unknown; label: string }): Record<string, unknown> {
  if (value === undefined || value === null || value === '') {
    return {};
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return { ...value };
}

function compact(values: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

function describeError({ status, body }: { status: number; body: unknown }): string {
  const detail = vendorMessage(body);
  const hint = STATUS_HINTS[status];
  return [`Zendesk API error ${status}`, hint, detail].filter((part) => part).join(': ');
}

function vendorMessage(body: unknown): string {
  if (typeof body === 'string') {
    return body;
  }
  if (!body || typeof body !== 'object') {
    return '';
  }
  const parts = [
    'error' in body ? body.error : undefined,
    'description' in body ? body.description : undefined,
    'details' in body ? body.details : undefined,
  ];
  return parts
    .filter((part) => part !== undefined && part !== null)
    .map((part) => (typeof part === 'string' ? part : JSON.stringify(part)))
    .join(' — ');
}

const STATUS_HINTS: Record<number, string> = {
  401: 'the connection is invalid or expired',
  403: 'the connected user lacks the permission or plan feature for this operation',
  404: 'the record was not found',
  409: 'the record changed since it was read (safe update conflict)',
  422: 'Zendesk rejected the input',
  429: 'rate limit exceeded, retry later',
};

export const zendeskApi = {
  request,
  send,
  optionalBoolean,
  id,
  optionalId,
  pathSegment,
  jsonArray,
  idList,
  stringList,
  query,
  cursorQuery,
  cursorResult,
  offsetQuery,
  offsetResult,
  jsonObject,
  compact,
};

export type CursorMeta = { has_more?: boolean; after_cursor?: string | null };

type RequestParams = {
  auth: ZendeskAuthValue;
  method: HttpMethod;
  path: string;
  queryParams?: QueryParams;
  body?: unknown;
};
