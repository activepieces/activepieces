import {
  httpClient,
  HttpError,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';

export const freshsalesClient = {
  normalizeAlias,
  getBaseUrl,
  getAuthHeaders,
  request,
  pickDefined,
  toId,
  requireId,
  toCustomFields,
  toIsoDate,
  unwrap,
  readArray,
  readMeta,
  isRecord,
  isNotFound,
};

export class FreshsalesApiError extends Error {
  readonly status: number;

  constructor({ status, message }: { status: number; message: string }) {
    super(message);
    this.name = 'FreshsalesApiError';
    this.status = status;
  }
}

const HOST_SUFFIX = '.myfreshworks.com';
const ALIAS_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

function normalizeAlias(input: string): string {
  const withoutScheme = input.trim().toLowerCase().replace(/^https?:\/\//, '');
  const host = withoutScheme.split(/[/?#]/)[0];
  const slug = host.endsWith(HOST_SUFFIX)
    ? host.slice(0, -HOST_SUFFIX.length)
    : host;
  if (!ALIAS_PATTERN.test(slug)) {
    throw new Error(
      'Invalid Freshsales alias. Enter the part before .myfreshworks.com, e.g. "acme".'
    );
  }
  return slug;
}

function getCrmRootUrl(alias: string): string {
  return `https://${normalizeAlias(alias)}${HOST_SUFFIX}/crm/sales`;
}

function getBaseUrl(alias: string): string {
  return `${getCrmRootUrl(alias)}/api`;
}

function getAuthHeaders(auth: FreshsalesAuthValue): Record<string, string> {
  return {
    Authorization: `Token token=${auth.password.trim()}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractVendorMessage(body: unknown): string | undefined {
  if (typeof body === 'string' && body.length > 0) {
    return body.slice(0, 300);
  }
  if (!isRecord(body)) {
    return undefined;
  }
  const errors = body['errors'];
  if (isRecord(errors)) {
    const message = errors['message'];
    if (Array.isArray(message)) {
      return message.map((m) => String(m)).join('; ');
    }
    if (typeof message === 'string') {
      return message;
    }
  }
  if (typeof body['message'] === 'string') {
    return body['message'];
  }
  return undefined;
}

function describeError({
  status,
  body,
}: {
  status: number;
  body: unknown;
}): string {
  const vendorMessage = extractVendorMessage(body);
  if (status === 401 || status === 403) {
    return `Freshsales rejected the API key (HTTP ${status}). Check the API key and alias.${
      vendorMessage ? ` ${vendorMessage}` : ''
    }`;
  }
  if (status === 404) {
    return `Freshsales record or endpoint not found (HTTP 404).${
      vendorMessage ? ` ${vendorMessage}` : ''
    }`;
  }
  if (status === 429) {
    return 'Freshsales rate limit reached (1000 requests per hour). Try again later.';
  }
  if (status >= 300 && status < 400) {
    return `Freshsales redirected the request (HTTP ${status}). Check the account alias.`;
  }
  return `Freshsales request failed (HTTP ${status})${
    vendorMessage ? `: ${vendorMessage}` : '.'
  }`;
}

async function request<T>({
  auth,
  method,
  path,
  query,
  body,
}: RequestParams): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${getCrmRootUrl(auth.username)}${path}`,
      headers: getAuthHeaders(auth),
      queryParams: query,
      body,
      followRedirects: false,
    });
    if (response.status >= 300) {
      throw new FreshsalesApiError({
        status: response.status,
        message: describeError({ status: response.status, body: response.body }),
      });
    }
    return response.body;
  } catch (error) {
    if (error instanceof HttpError) {
      throw new FreshsalesApiError({
        status: error.response.status,
        message: describeError({ status: error.response.status, body: error.response.body }),
      });
    }
    throw error;
  }
}

function isNotFound(error: unknown): boolean {
  return error instanceof FreshsalesApiError && error.status === 404;
}

function pickDefined(
  input: Record<string, unknown>
): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && value !== null && value !== '') {
      output[key] = value;
    }
  }
  return output;
}

function toId({
  value,
  field,
}: {
  value: unknown;
  field: string;
}): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const text = String(value).trim();
  if (!/^\d+$/.test(text)) {
    throw new Error(`${field} must be a numeric Freshsales ID, got "${text}".`);
  }
  return Number(text);
}

function requireId({ value, field }: { value: unknown; field: string }): number {
  const id = toId({ value, field });
  if (id === undefined) {
    throw new Error(`${field} is required.`);
  }
  return id;
}

function toCustomFields(value: unknown): Record<string, unknown> | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (!isRecord(value)) {
    throw new Error('Custom Fields must be a JSON object, e.g. {"cf_plan": "Pro"}.');
  }
  return Object.keys(value).length > 0 ? value : undefined;
}

function toIsoDate(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date "${String(value)}". Use ISO 8601.`);
  }
  return date.toISOString();
}

function unwrap({
  body,
  key,
}: {
  body: unknown;
  key: string;
}): Record<string, unknown> {
  if (isRecord(body) && isRecord(body[key])) {
    return body[key];
  }
  throw new Error(`Unexpected Freshsales response: missing "${key}".`);
}

function readArray({ body, key }: { body: unknown; key: string }): unknown[] {
  if (isRecord(body) && Array.isArray(body[key])) {
    return body[key];
  }
  return [];
}

function readMeta(body: unknown): { total?: number; total_pages?: number } {
  if (isRecord(body) && isRecord(body['meta'])) {
    const meta = body['meta'];
    return {
      total: typeof meta['total'] === 'number' ? meta['total'] : undefined,
      total_pages:
        typeof meta['total_pages'] === 'number' ? meta['total_pages'] : undefined,
    };
  }
  return {};
}

export type FreshsalesAuthValue = {
  username: string;
  password: string;
};

type RequestParams = {
  auth: FreshsalesAuthValue;
  method: HttpMethod;
  path: string;
  query?: QueryParams;
  body?: unknown;
};
