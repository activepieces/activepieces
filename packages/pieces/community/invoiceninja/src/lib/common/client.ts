import { httpClient, HttpMethod, HttpResponse, QueryParams } from '@activepieces/pieces-common';

const REQUEST_TIMEOUT_MS = 30_000;
const ID_PATTERN = /^[A-Za-z0-9]{1,64}$/;
let verifiedTlsAgent: Promise<unknown> | undefined;

export class InvoiceNinjaApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseBody: unknown,
  ) {
    super(message);
    this.name = 'InvoiceNinjaApiError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function arrayOf(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeBaseUrl(raw: unknown): string {
  const text = typeof raw === 'string' ? raw.trim() : '';
  if (!text) {
    throw new Error('The Invoice Ninja connection has no Base URL.');
  }
  let parsed: URL;
  try {
    parsed = new URL(text);
  } catch {
    throw new Error('The Base URL is not a valid URL. Use a full address like https://invoicing.co or https://invoices.example.com.');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('The Base URL must start with https:// (or http:// for a self-hosted server).');
  }
  if (parsed.username || parsed.password) {
    throw new Error('The Base URL must not contain a username or password.');
  }
  if (parsed.search || parsed.hash || text.includes('?') || text.includes('#')) {
    throw new Error('The Base URL must not contain a query string or fragment.');
  }
  const segments = parsed.pathname.split('/').filter((part) => part !== '');
  if (/\/\.{1,2}(\/|$)|%2e/i.test(text) || segments.some((part) => part.includes('%'))) {
    throw new Error('The Base URL must not contain relative or encoded path segments.');
  }
  const path = `/${segments.join('/')}`.replace(/\/api\/v1$/i, '').replace(/\/+$/, '');
  return `${parsed.origin}${path}`;
}

function apiBaseUrl(raw: unknown): string {
  return `${normalizeBaseUrl(raw)}/api/v1`;
}

function tokenOf(auth: InvoiceNinjaAuthValue): string {
  const token = typeof auth.access_token === 'string' ? auth.access_token.trim() : '';
  if (!token) {
    throw new Error('The Invoice Ninja connection has no API Token.');
  }
  return token;
}

function authHeaders(auth: InvoiceNinjaAuthValue): Record<string, string> {
  return {
    'X-API-TOKEN': tokenOf(auth),
    'X-Requested-With': 'XMLHttpRequest',
    Accept: 'application/json',
  };
}

function isSameOrigin({ url, baseUrl }: { url: string; baseUrl: string }): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.username || parsed.password) return false;
  const base = new URL(baseUrl);
  if (parsed.origin !== base.origin) return false;
  const basePath = base.pathname.replace(/\/+$/, '');
  if (basePath === '') return true;
  return parsed.pathname === basePath || parsed.pathname.startsWith(`${basePath}/`);
}

function vendorMessage(body: unknown): string {
  if (isRecord(body)) {
    const message = typeof body['message'] === 'string' ? body['message'].trim() : '';
    const errors = isRecord(body['errors'])
      ? Object.entries(body['errors'])
          .map(([field, value]) => `${field}: ${arrayOf(value).filter((item): item is string => typeof item === 'string').map((item) => item.replace(/\.+$/, '')).join(' ')}`)
          .join('; ')
      : '';
    const notFound = /^No query results for model/i.test(message) ? 'record not found' : message;
    const combined = [notFound.replace(/\.+$/, ''), errors].filter((part) => part !== '').join('. ');
    if (combined) return combined.slice(0, 500);
  }
  if (typeof body === 'string' && body.trim()) return body.trim().slice(0, 300);
  return 'request failed';
}

function hintFor({ status, body }: { status: number; body: unknown }): string {
  const notFound = isRecord(body) && typeof body['message'] === 'string' && /^No query results for model/i.test(body['message']);
  if (status === 401 || status === 403) return ' Check the API Token in the Invoice Ninja connection.';
  if (status === 404 || notFound) return ' Check the Base URL and the ID.';
  if (status === 429) return ' Invoice Ninja rate limit reached, try again later.';
  return '';
}

function toApiError({ status, body }: { status: number; body: unknown }): InvoiceNinjaApiError {
  const base = status >= 300 && status < 400 ? 'unexpected redirect (check the Base URL)' : vendorMessage(body);
  return new InvoiceNinjaApiError(`Invoice Ninja API error (${status}): ${base}.${hintFor({ status, body })}`, status, body);
}

function verifiedTls(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
  return verifiedTlsAgent;
}

function failureOf(error: unknown): { status: number; body: unknown } | null {
  if (error === null || typeof error !== 'object') return null;
  const response = Reflect.get(error, 'response');
  if (!isRecord(response)) return null;
  const status = response['status'];
  return typeof status === 'number' ? { status, body: response['body'] } : null;
}

function buildQuery(query?: QueryInput): QueryParams {
  return Object.fromEntries(
    Object.entries(query ?? {})
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)]),
  );
}

async function request({ auth, method, path, query, body, timeoutMs }: InvoiceNinjaRequest): Promise<unknown> {
  const baseUrl = apiBaseUrl(auth.base_url);
  const headers = authHeaders(auth);
  const hasBody = body !== undefined;
  if (hasBody) headers['Content-Type'] = 'application/json';
  const dispatcher = await verifiedTls();
  let status: number;
  let responseBody: unknown;
  try {
    const response: HttpResponse = await httpClient.sendRequest(
      {
        method,
        url: `${baseUrl}${path}`,
        headers,
        queryParams: buildQuery(query),
        body: hasBody ? body : undefined,
        timeout: Math.min(REQUEST_TIMEOUT_MS, Math.max(1, Math.floor(timeoutMs ?? REQUEST_TIMEOUT_MS))),
        followRedirects: false,
      },
      { dispatcher },
    );
    status = response.status;
    responseBody = response.body;
  } catch (error) {
    const failure = failureOf(error);
    if (!failure) throw error;
    status = failure.status;
    responseBody = failure.body;
  }
  if (status < 200 || status >= 300) {
    throw toApiError({ status, body: responseBody });
  }
  return responseBody;
}

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== 'password')
      .map(([key, inner]) => [key, sanitize(inner)]),
  );
}

function dataOf(body: unknown): unknown {
  return sanitize(isRecord(body) && 'data' in body ? body['data'] : body);
}

function recordOf(body: unknown): Record<string, unknown> {
  const data = dataOf(body);
  if (Array.isArray(data)) {
    const first = data[0];
    return isRecord(first) ? first : {};
  }
  return isRecord(data) ? data : {};
}

function envelopeOf(body: unknown): { data: unknown } {
  return { data: dataOf(body) };
}

async function getRecord({ auth, entity, id, include }: { auth: InvoiceNinjaAuthValue; entity: string; id: string; include?: string }): Promise<Record<string, unknown>> {
  const body = await request({ auth, method: HttpMethod.GET, path: `/${entity}/${id}`, query: { include } });
  return recordOf(body);
}

async function listPage({ auth, entity, query, page, perPage }: ListPageInput): Promise<ListPageResult> {
  const body = await request({
    auth,
    method: HttpMethod.GET,
    path: `/${entity}`,
    query: { ...query, page, per_page: perPage },
  });
  const items = arrayOf(dataOf(body));
  const meta = isRecord(body) && isRecord(body['meta']) ? body['meta'] : {};
  const pagination = isRecord(meta['pagination']) ? meta['pagination'] : {};
  const total = typeof pagination['total'] === 'number' ? pagination['total'] : items.length;
  const totalPages = typeof pagination['total_pages'] === 'number' ? pagination['total_pages'] : page;
  return { items, page, perPage, total, hasMore: page < totalPages };
}

async function bulk({ auth, entity, action, ids }: BulkInput): Promise<Record<string, unknown>> {
  const body = await request({ auth, method: HttpMethod.POST, path: `/${entity}/bulk`, body: { action, ids } });
  return recordOf(body);
}

function parseId({ value, label }: { value: unknown; label: string }): string {
  const text = typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
  if (!ID_PATTERN.test(text)) {
    throw new Error(`${label} must be an Invoice Ninja ID (letters and digits only, e.g. VolejRejNm).`);
  }
  return text;
}

function optionalId({ value, label }: { value: unknown; label: string }): string | undefined {
  const text = optionalText(value);
  return text === undefined ? undefined : parseId({ value: text, label });
}

function optionalText(value: unknown): string | undefined {
  if (typeof value === 'number') return String(value);
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text === '' ? undefined : text;
}

function optionalNumber({ value, label, min, max }: { value: unknown; label: string; min?: number; max?: number }): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = typeof value === 'string' ? Number(value.trim()) : value;
  if (typeof parsed !== 'number' || !Number.isFinite(parsed)) {
    throw new Error(`${label} must be a number.`);
  }
  if ((min !== undefined && parsed < min) || (max !== undefined && parsed > max)) {
    throw new Error(`${label} must be between ${min ?? '-∞'} and ${max ?? '∞'}.`);
  }
  return parsed;
}

function optionalInt({ value, label, min, max }: { value: unknown; label: string; min: number; max: number }): number | undefined {
  const parsed = optionalNumber({ value, label, min, max });
  if (parsed !== undefined && !Number.isInteger(parsed)) {
    throw new Error(`${label} must be a whole number.`);
  }
  return parsed;
}

function toDateOnly({ value, label }: { value: unknown; label: string }): string | undefined {
  const text = optionalText(value);
  if (text === undefined) return undefined;
  const match = /^(\d{4}-\d{2}-\d{2})(?:$|T)/.exec(text);
  if (!match || Number.isNaN(Date.parse(`${match[1]}T00:00:00Z`))) {
    throw new Error(`${label} must be a date like 2026-01-31.`);
  }
  return match[1];
}

function parseBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function paging({ page, perPage }: { page: unknown; perPage: unknown }): { page: number; perPage: number } {
  return {
    page: optionalInt({ value: page, label: 'Page', min: 1, max: 100000 }) ?? 1,
    perPage: optionalInt({ value: perPage, label: 'Per Page', min: 1, max: 100 }) ?? 20,
  };
}

function clearedFields({ value, allowed }: { value: unknown; allowed: readonly string[] }): Record<string, string> {
  const list = arrayOf(value).filter((item): item is string => typeof item === 'string');
  const unknown = list.filter((item) => !allowed.includes(item));
  if (unknown.length > 0) {
    throw new Error(`Cannot clear ${unknown.join(', ')}. Allowed: ${allowed.join(', ')}.`);
  }
  return Object.fromEntries(list.map((field) => [field, '']));
}

function compact(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

function lineItemsOf({
  value,
  label,
  required,
  isAmountDiscount,
}: {
  value: unknown;
  label: string;
  required: boolean;
  isAmountDiscount?: boolean;
}): Record<string, unknown>[] | undefined {
  if (value === undefined || value === null || value === '') {
    if (required) throw new Error(`${label} needs at least one line item.`);
    return undefined;
  }
  const list = arrayOf(value);
  if (list.length === 0) {
    if (required) throw new Error(`${label} needs at least one line item.`);
    return undefined;
  }
  return list.map((item, index) => {
    if (!isRecord(item)) throw new Error(`${label} item ${index + 1} must be an object.`);
    const row = `${label} item ${index + 1}`;
    const line = compact({
      product_key: optionalText(item['product_key']),
      notes: optionalText(item['notes']),
      cost: optionalNumber({ value: item['cost'], label: `${row} cost` }),
      quantity: optionalNumber({ value: item['quantity'], label: `${row} quantity` }) ?? 1,
      discount: optionalNumber({ value: item['discount'], label: `${row} discount`, min: 0 }),
      is_amount_discount: isAmountDiscount,
      tax_name1: optionalText(item['tax_name1']),
      tax_rate1: optionalNumber({ value: item['tax_rate1'], label: `${row} tax rate`, min: 0, max: 100 }),
    });
    if (line['product_key'] === undefined && line['notes'] === undefined) {
      throw new Error(`${row} needs a product key or a description.`);
    }
    return line;
  });
}

export const invoiceNinjaClient = {
  request,
  normalizeBaseUrl,
  apiBaseUrl,
  authHeaders,
  tokenOf,
  isSameOrigin,
  getRecord,
  listPage,
  bulk,
  dataOf,
  envelopeOf,
  recordOf,
  parseId,
  optionalId,
  optionalText,
  optionalNumber,
  optionalInt,
  toDateOnly,
  parseBoolean,
  paging,
  clearedFields,
  compact,
  lineItemsOf,
  isRecord,
  arrayOf,
};

type QueryInput = Record<string, string | number | boolean | undefined>;

export type InvoiceNinjaAuthValue = {
  base_url: string;
  access_token: string;
};

export type InvoiceNinjaRequest = {
  auth: InvoiceNinjaAuthValue;
  method: HttpMethod;
  path: string;
  query?: QueryInput;
  body?: unknown;
  timeoutMs?: number;
};

type ListPageInput = {
  auth: InvoiceNinjaAuthValue;
  entity: string;
  query: QueryInput;
  page: number;
  perPage: number;
};

export type ListPageResult = {
  items: unknown[];
  page: number;
  perPage: number;
  total: number;
  hasMore: boolean;
};

type BulkInput = {
  auth: InvoiceNinjaAuthValue;
  entity: string;
  action: string;
  ids: string[];
};
