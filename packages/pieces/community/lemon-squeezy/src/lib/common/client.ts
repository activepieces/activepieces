import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';

export const LEMON_SQUEEZY_API_BASE = 'https://api.lemonsqueezy.com/v1';

export const MAX_DROPDOWN_PAGES = 10;

export class LemonSqueezyApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseBody?: unknown,
  ) {
    super(message);
    this.name = 'LemonSqueezyApiError';
  }
}

export function getLemonSqueezyHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey.trim()}`,
    Accept: 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
  };
}

export function numericId({ value, label }: { value: unknown; label: string }): string {
  const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : '';
  if (!/^[1-9]\d{0,18}$/.test(text)) {
    throw new Error(`${label} must be a numeric Lemon Squeezy ID (for example 12345), got "${String(value ?? '')}".`);
  }
  return text;
}

export function seg({ value, label }: { value: unknown; label: string }): string {
  return encodeURIComponent(numericId({ value, label }));
}

export function optionalId({ value, label }: { value: unknown; label: string }): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return numericId({ value, label });
}

export function isoDateOrUndefined({ value, label }: { value: unknown; label: string }): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const text = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(text) || Number.isNaN(Date.parse(text))) {
    throw new Error(`${label} must be an ISO 8601 date or date-time, for example 2026-12-31T23:59:59Z.`);
  }
  return new Date(text).toISOString();
}

export function buildQueryString(params: Record<string, string | undefined>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    parts.push(`${key}=${encodeURIComponent(value)}`);
  }
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

export function pageParams({ page, perPage }: { page?: unknown; perPage?: unknown }): Record<string, string> {
  const params: Record<string, string> = {};
  if (page !== undefined && page !== null && page !== '') {
    const n = Number(page);
    if (!Number.isInteger(n) || n < 1) throw new Error('Page must be a whole number of 1 or more.');
    params['page[number]'] = String(n);
  }
  if (perPage !== undefined && perPage !== null && perPage !== '') {
    const n = Number(perPage);
    if (!Number.isInteger(n) || n < 1 || n > 100) throw new Error('Per Page must be a whole number between 1 and 100.');
    params['page[size]'] = String(n);
  }
  return params;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function readPath({ value, path }: { value: unknown; path: string[] }): unknown {
  let current: unknown = value;
  for (const key of path) {
    if (!isRecord(current)) return undefined;
    current = current[key];
  }
  return current;
}

export async function lsRequest({
  apiKey,
  method,
  path,
  query,
  body,
  rateLimitWaitsMs = RATE_LIMIT_WAITS.action,
}: {
  apiKey: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  query?: Record<string, string | undefined>;
  body?: unknown;
  rateLimitWaitsMs?: readonly number[];
}): Promise<{ status: number; body: unknown }> {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('..')) {
    throw new Error(`Invalid Lemon Squeezy API path: ${path}`);
  }
  const url = `${LEMON_SQUEEZY_API_BASE}${path}${buildQueryString(query ?? {})}`;
  for (let attempt = 0; ; attempt++) {
    const response = await send({
      method: HttpMethod[method],
      url,
      headers: getLemonSqueezyHeaders(apiKey),
      body,
      redactBodyInErrors: body !== undefined,
    });
    const wait = rateLimitWaitsMs[attempt];
    if (response.status === 429 && wait !== undefined) {
      await sleep(wait);
      continue;
    }
    if (response.status >= 300 && response.status < 400) {
      throw new LemonSqueezyApiError(`Lemon Squeezy answered with an unexpected redirect (${response.status}).`, response.status);
    }
    if (response.status < 200 || response.status >= 400) {
      throw new LemonSqueezyApiError(messageForStatus({ status: response.status, detail: errorDetail(response.body) }), response.status, response.body);
    }
    return { status: response.status, body: response.body };
  }
}

export function toResource(value: unknown): JsonApiResource {
  if (!isRecord(value) || (typeof value['id'] !== 'string' && typeof value['id'] !== 'number')) {
    throw new Error('Lemon Squeezy returned an unexpected response (no record).');
  }
  return {
    id: String(value['id']),
    type: typeof value['type'] === 'string' ? value['type'] : '',
    attributes: isRecord(value['attributes']) ? value['attributes'] : {},
  };
}

export function flatten(resource: JsonApiResource): Record<string, unknown> & { id: string } {
  return { ...resource.attributes, id: resource.id };
}

export function flattenList(body: unknown) {
  const data = readPath({ value: body, path: ['data'] });
  const page = readPath({ value: body, path: ['meta', 'page'] });
  const num = (key: string) => {
    const value = readPath({ value: page, path: [key] });
    return typeof value === 'number' ? value : undefined;
  };
  const currentPage = num('currentPage') ?? 1;
  const lastPage = num('lastPage') ?? currentPage;
  return {
    items: (Array.isArray(data) ? data : []).map((item) => flatten(toResource(item))),
    page: currentPage,
    last_page: lastPage,
    per_page: num('perPage') ?? null,
    total: num('total') ?? null,
    has_more: currentPage < lastPage,
  };
}

export async function getRecord({ apiKey, path, query }: { apiKey: string; path: string; query?: Record<string, string | undefined> }) {
  const { body } = await lsRequest({ apiKey, method: 'GET', path, query });
  return flatten(toResource(readPath({ value: body, path: ['data'] })));
}

export async function listRecords({ apiKey, path, query }: { apiKey: string; path: string; query: Record<string, string | undefined> }) {
  const { body } = await lsRequest({ apiKey, method: 'GET', path, query });
  return flattenList(body);
}

export async function createRecord({
  apiKey,
  path,
  type,
  attributes,
  relationships,
}: {
  apiKey: string;
  path: string;
  type: string;
  attributes: Record<string, unknown>;
  relationships: Record<string, { data: { type: string; id: string } }>;
}) {
  const { body } = await lsRequest({ apiKey, method: 'POST', path, body: { data: { type, attributes, relationships } } });
  return flatten(toResource(readPath({ value: body, path: ['data'] })));
}

export async function patchRecord({
  apiKey,
  type,
  path,
  id,
  attributes,
}: {
  apiKey: string;
  type: string;
  path: string;
  id: string;
  attributes: Record<string, unknown>;
}) {
  const { body } = await lsRequest({ apiKey, method: 'PATCH', path, body: { data: { type, id, attributes } } });
  return flatten(toResource(readPath({ value: body, path: ['data'] })));
}

export async function deleteRecord({ apiKey, path }: { apiKey: string; path: string }) {
  const { body } = await lsRequest({ apiKey, method: 'DELETE', path });
  return body;
}

export async function listAllPages({
  apiKey,
  path,
  query,
  maxPages = MAX_DROPDOWN_PAGES,
}: {
  apiKey: string;
  path: string;
  query?: Record<string, string | undefined>;
  maxPages?: number;
}): Promise<{ items: JsonApiResource[]; truncated: boolean }> {
  const items: JsonApiResource[] = [];
  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber++) {
    const { body } = await lsRequest({
      apiKey,
      method: 'GET',
      path,
      query: { ...query, 'page[number]': String(pageNumber), 'page[size]': '100' },
      rateLimitWaitsMs: RATE_LIMIT_WAITS.interactive,
    });
    const data = readPath({ value: body, path: ['data'] });
    for (const item of Array.isArray(data) ? data : []) items.push(toResource(item));
    const lastPage = readPath({ value: body, path: ['meta', 'page', 'lastPage'] });
    if (pageNumber >= (typeof lastPage === 'number' ? lastPage : pageNumber)) return { items, truncated: false };
  }
  return { items, truncated: true };
}

export async function getTestModeForKey(apiKey: string): Promise<boolean> {
  const { body } = await lsRequest({ apiKey, method: 'GET', path: '/users/me', rateLimitWaitsMs: RATE_LIMIT_WAITS.interactive });
  return readPath({ value: body, path: ['meta', 'test_mode'] }) === true;
}

export async function validateLicenseKey({ licenseKey, instanceId }: { licenseKey: string; instanceId?: string }) {
  const form = new URLSearchParams({ license_key: licenseKey });
  if (instanceId) form.set('instance_id', instanceId);
  const response = await send({
    method: HttpMethod.POST,
    url: `${LEMON_SQUEEZY_API_BASE}/licenses/validate`,
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
    redactBodyInErrors: true,
  });
  if (response.status !== 200 && response.status !== 400 && response.status !== 404 && response.status !== 422) {
    const error = readPath({ value: response.body, path: ['error'] });
    throw new LemonSqueezyApiError(
      messageForStatus({ status: response.status, detail: typeof error === 'string' ? error : undefined }),
      response.status,
      undefined,
    );
  }
  return response.body;
}

export async function lookupLicenseKeyId(licenseKey: string): Promise<string | undefined> {
  const body = await validateLicenseKey({ licenseKey });
  const id = readPath({ value: body, path: ['license_key', 'id'] });
  return typeof id === 'number' || typeof id === 'string' ? String(id) : undefined;
}

const REQUEST_TIMEOUT_MS = 30_000;

let verifiedTlsAgent: Promise<unknown> | undefined;

function verifiedTls(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
  return verifiedTlsAgent;
}

function errorDetail(body: unknown): string | undefined {
  const errors = readPath({ value: body, path: ['errors'] });
  if (!Array.isArray(errors)) return undefined;
  const details = errors
    .map((e) => {
      const detail = readPath({ value: e, path: ['detail'] });
      const title = readPath({ value: e, path: ['title'] });
      return typeof detail === 'string' ? detail : typeof title === 'string' ? title : undefined;
    })
    .filter((d): d is string => !!d);
  return details.length > 0 ? details.join('; ') : undefined;
}

function messageForStatus({ status, detail }: { status: number; detail: string | undefined }): string {
  const suffix = detail ? `: ${detail}` : '';
  switch (status) {
    case 401:
      return `Lemon Squeezy rejected the API key (401). Check that the key is valid and not revoked${suffix}`;
    case 403:
      return `The API key is not allowed to do this (403)${suffix}`;
    case 404:
      return `Lemon Squeezy could not find that record (404)${suffix}`;
    case 422:
      return `Lemon Squeezy rejected the request (422)${suffix}`;
    case 429:
      return `Lemon Squeezy rate limit reached (429). Try again in a minute${suffix}`;
    default:
      return `Lemon Squeezy API error (${status})${suffix}`;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function failureOf(error: unknown): RawResponse | null {
  const status = readPath({ value: error, path: ['response', 'status'] });
  return typeof status === 'number' ? { status, body: readPath({ value: error, path: ['response', 'body'] }) } : null;
}

async function send(request: HttpRequest): Promise<RawResponse> {
  const dispatcher = await verifiedTls();
  try {
    const response = await httpClient.sendRequest(
      { ...request, timeout: REQUEST_TIMEOUT_MS, followRedirects: false, responseType: 'json' },
      { dispatcher },
    );
    return { status: response.status, body: response.body };
  } catch (error) {
    const failure = failureOf(error);
    if (failure) return failure;
    throw error;
  }
}

export const RATE_LIMIT_WAITS: { action: readonly number[]; interactive: readonly number[] } = { action: [20_000, 40_000], interactive: [] };

export type JsonApiResource = { id: string; type: string; attributes: Record<string, unknown> };

type RawResponse = { status: number; body: unknown };
