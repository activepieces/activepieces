import {
  AuthenticationType,
  HttpError,
  HttpMethod,
  HttpRequest,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';

export class XeroApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({ message, status, responseBody }: { message: string; status: number; responseBody: unknown }) {
    super(message);
    this.name = 'XeroApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function readRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function wait({ ms }: { ms: number }) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function validationMessages({ body }: { body: unknown }): string[] {
  if (!isRecord(body)) return [];
  const messages: string[] = [];
  for (const element of readRecords(body['Elements'])) {
    for (const error of readRecords(element['ValidationErrors'])) {
      const message = readString(error['Message']);
      if (message && !messages.includes(message)) messages.push(message);
    }
  }
  return messages;
}

function describeXeroError({ status, body }: { status: number; body: unknown }): string {
  const validation = validationMessages({ body });
  if (validation.length > 0) return truncate({ text: validation.join('; '), max: MAX_ERROR_DETAIL_CHARS });
  if (isRecord(body)) {
    const parts = [readString(body['Message']), readString(body['Detail']), readString(body['Title']), readString(body['detail'])];
    const found = parts.find((part) => part !== undefined);
    if (found) return truncate({ text: found, max: MAX_ERROR_DETAIL_CHARS });
  }
  if (typeof body === 'string' && body.trim().length > 0) return truncate({ text: body.trim(), max: 300 });
  return `HTTP ${status}`;
}

function truncate({ text, max }: { text: string; max: number }): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function boundedBody({ body }: { body: unknown }): unknown {
  const serialized = typeof body === 'string' ? body : JSON.stringify(body ?? null);
  return serialized.length > MAX_ERROR_BODY_CHARS ? truncate({ text: serialized, max: MAX_ERROR_BODY_CHARS }) : body;
}

function errorHint({ status }: { status: number }): string {
  if (status === 401) {
    return ' The Xero connection was rejected; reconnect it, and check that it was granted the permission this step needs.';
  }
  if (status === 403) {
    return ' The connected Xero user or app is not allowed to do this for this organisation.';
  }
  if (status === 404) {
    return ' Check the ID and the selected organisation.';
  }
  return '';
}

function toXeroError({ error, operation }: { error: HttpError; operation: string }): XeroApiError {
  const status = error.response.status;
  const body = error.response.body;
  if (status === 429) {
    return new XeroApiError({
      message: `Xero rate limit reached during ${operation}: Xero allows 60 calls per minute and 5 concurrent calls per organisation (5,000 per day). Wait a minute and retry, or space out the steps.`,
      status,
      responseBody: boundedBody({ body }),
    });
  }
  return new XeroApiError({
    message: `Xero ${operation} failed (HTTP ${status}): ${describeXeroError({ status, body }).replace(/\.+$/, '')}.${errorHint({ status })}`,
    status,
    responseBody: boundedBody({ body }),
  });
}

async function xeroRequest<T>({
  accessToken,
  tenantId,
  method,
  url,
  body,
  queryParams,
  headers,
  responseType,
  timeout,
  operation,
}: XeroRequestParams): Promise<T> {
  const request: HttpRequest = {
    method,
    url,
    body,
    queryParams,
    responseType,
    timeout,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token: accessToken },
    headers: {
      Accept: 'application/json',
      ...(tenantId ? { 'Xero-Tenant-Id': tenantId } : {}),
      ...(headers ?? {}),
    },
  };
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await httpClient.sendRequest<T>(request);
      return response.body;
    } catch (error) {
      if (!(error instanceof HttpError)) throw error;
      if (error.response.status === 429 && attempt === 0) {
        await wait({ ms: RATE_LIMIT_RETRY_MS });
        continue;
      }
      throw toXeroError({ error, operation });
    }
  }
}

function requiredText({ value, field }: { value: unknown; field: string }): string {
  const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : '';
  if (text.length === 0) throw new Error(`${field} is required.`);
  return text;
}

function pathSegment({ value, field }: { value: unknown; field: string }): string {
  return encodeURIComponent(requiredText({ value, field }));
}

function whereString({ value }: { value: string }): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function isGuid(value: unknown): boolean {
  return typeof value === 'string' && GUID_PATTERN.test(value);
}

function whereGuid({ value, field }: { value: string; field: string }): string {
  const trimmed = value.trim();
  if (!GUID_PATTERN.test(trimmed)) throw new Error(`${field} must be a Xero ID (a GUID such as 00000000-0000-0000-0000-000000000000).`);
  return `guid("${trimmed}")`;
}

function parseDateInput({ value, field }: { value: unknown; field: string }): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const text = typeof value === 'string' ? value.trim() : '';
  const match = DATE_PATTERN.exec(text);
  if (!match) throw new Error(`${field} must be a date in YYYY-MM-DD format.`);
  const date = new Date(`${text}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text) {
    throw new Error(`${field} is not a valid calendar date.`);
  }
  return text;
}

function whereDate({ value }: { value: string }): string {
  const [year, month, day] = value.split('-').map((part) => Number(part));
  return `DateTime(${year}, ${month}, ${day})`;
}

function xeroDateToEpoch({ value }: { value: unknown }): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;
  const match = /\/Date\((-?\d+)/.exec(value);
  if (match) return Number(match[1]);
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseDecimal({
  value,
  field,
  maxDecimals,
  positive,
}: {
  value: unknown;
  field: string;
  maxDecimals: number;
  positive?: boolean;
}): number {
  const text = typeof value === 'number' ? (Number.isFinite(value) ? String(value) : '') : typeof value === 'string' ? value.trim() : '';
  if (!DECIMAL_PATTERN.test(text)) throw new Error(`${field} must be a plain number such as 12.5.`);
  const [whole, fraction = ''] = text.replace('-', '').split('.');
  if (fraction.length > maxDecimals) throw new Error(`${field} can have at most ${maxDecimals} decimal places (got ${text}).`);
  const significant = `${whole.replace(/^0+/, '')}${fraction}`.replace(/0+$/, '');
  if (significant.length > 15) throw new Error(`${field} has more than 15 significant digits and cannot be sent exactly.`);
  const parsed = Number(text);
  if (positive && parsed <= 0) throw new Error(`${field} must be greater than zero.`);
  return parsed;
}

function optionalDecimal(params: { value: unknown; field: string; maxDecimals: number; positive?: boolean }): number | undefined {
  if (params.value === undefined || params.value === null || params.value === '') return undefined;
  return parseDecimal(params);
}

function toScaledInteger({ value, decimals }: { value: number; decimals: number }): bigint {
  const text = String(value);
  if (!DECIMAL_PATTERN.test(text)) throw new Error(`Cannot represent ${text} exactly.`);
  const negative = text.startsWith('-');
  const [whole, fraction = ''] = text.replace('-', '').split('.');
  if (fraction.length > decimals) throw new Error(`${text} has more than ${decimals} decimal places.`);
  const scaled = BigInt(`${whole}${fraction.padEnd(decimals, '0')}`);
  return negative ? -scaled : scaled;
}

async function listTenants({ accessToken }: { accessToken: string }): Promise<XeroTenant[]> {
  const body = await xeroRequest<unknown>({
    accessToken,
    method: HttpMethod.GET,
    url: XERO_URLS.connections,
    operation: 'list connected organisations',
  });
  return readRecords(body).flatMap((entry) => {
    const tenantId = readString(entry['tenantId']);
    if (!tenantId) return [];
    return [
      {
        tenantId,
        tenantName: readString(entry['tenantName']) ?? null,
        tenantType: readString(entry['tenantType']) ?? 'ORGANISATION',
        connectionId: readString(entry['id']) ?? null,
        createdDateUtc: readString(entry['createdDateUtc']) ?? null,
        updatedDateUtc: readString(entry['updatedDateUtc']) ?? null,
      },
    ];
  });
}

async function resolveTenantId({ accessToken, tenantId }: { accessToken: string; tenantId: unknown }): Promise<string> {
  const given = typeof tenantId === 'string' ? tenantId.trim() : '';
  if (given.length > 0) return given;
  const tenants = await listTenants({ accessToken });
  if (tenants.length === 1) return tenants[0].tenantId;
  if (tenants.length === 0) {
    throw new Error('No Xero organisation is connected. Reconnect the Xero connection and select an organisation.');
  }
  const list = tenants.map((tenant) => `${tenant.tenantName ?? 'Unnamed'} (${tenant.tenantId})`).join(', ');
  throw new Error(`This connection has ${tenants.length} Xero organisations; set Organisation ID to one of: ${list}. List Organisations returns the same IDs.`);
}

function firstRecord({ body, key, operation }: { body: unknown; key: string; operation: string }): Record<string, unknown> {
  const record = isRecord(body) ? readRecords(body[key])[0] : undefined;
  if (!record) throw new Error(`Xero ${operation} returned no ${key} record.`);
  return record;
}

function recordsOf({ body, key }: { body: unknown; key: string }): Record<string, unknown>[] {
  return isRecord(body) ? readRecords(body[key]) : [];
}

function pageParams({ page, pageSize, maxPageSize }: { page: unknown; pageSize: unknown; maxPageSize: number }) {
  const pageNumber = page === undefined || page === null || page === '' ? 1 : Number(page);
  if (!Number.isInteger(pageNumber) || pageNumber < 1) throw new Error('Page must be a whole number of 1 or more.');
  const size = pageSize === undefined || pageSize === null || pageSize === '' ? maxPageSize : Number(pageSize);
  if (!Number.isInteger(size) || size < 1 || size > maxPageSize) {
    throw new Error(`Page Size must be a whole number from 1 to ${maxPageSize}.`);
  }
  return { page: pageNumber, pageSize: size };
}

function pageResult({ body, key, page, pageSize }: { body: unknown; key: string; page: number; pageSize: number }) {
  const items = recordsOf({ body, key });
  const pagination = isRecord(body) && isRecord(body['pagination']) ? body['pagination'] : undefined;
  const pageCount = pagination && typeof pagination['pageCount'] === 'number' ? pagination['pageCount'] : undefined;
  const hasMore = pageCount !== undefined ? page < pageCount : items.length === pageSize;
  return { items, page, pageSize, hasMore };
}

function trimmedOrUndefined({ value }: { value: unknown }): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const GUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DECIMAL_PATTERN = /^-?\d+(\.\d+)?$/;

export const xeroApi = {
  request: xeroRequest,
  listTenants,
  resolveTenantId,
  firstRecord,
  recordsOf,
  pageResult,
  describeError: describeXeroError,
};

export const xeroInput = {
  requiredText,
  pathSegment,
  whereString,
  whereGuid,
  whereDate,
  parseDateInput,
  parseDecimal,
  optionalDecimal,
  toScaledInteger,
  pageParams,
  trimmedOrUndefined,
};

export const xeroValue = {
  isRecord,
  isGuid,
  readString,
  readRecords,
  xeroDateToEpoch,
};

const RATE_LIMIT_RETRY_MS = 30000;
const MAX_ERROR_DETAIL_CHARS = 1000;
const MAX_ERROR_BODY_CHARS = 4000;

export const XERO_URLS = {
  api: 'https://api.xero.com/api.xro/2.0',
  projects: 'https://api.xero.com/projects.xro/2.0',
  connections: 'https://api.xero.com/connections',
};

export type XeroTenant = {
  tenantId: string;
  tenantName: string | null;
  tenantType: string;
  connectionId: string | null;
  createdDateUtc: string | null;
  updatedDateUtc: string | null;
};

type XeroRequestParams = {
  accessToken: string;
  tenantId?: string;
  method: HttpMethod;
  url: string;
  body?: unknown;
  queryParams?: QueryParams;
  headers?: Record<string, string>;
  responseType?: HttpRequest['responseType'];
  timeout?: number;
  operation: string;
};
