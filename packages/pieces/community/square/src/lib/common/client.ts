import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';

const BASE_URL = 'https://connect.squareup.com';
const SQUARE_VERSION = '2026-09-16';
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_RATE_LIMIT_RETRIES = 3;
const RATE_LIMIT_BASE_DELAY_MS = 1_000;
const MAX_ERROR_TEXT = 600;

export class SquareApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly responseBody: unknown;

  constructor({ operation, status, responseBody }: { operation: string; status: number; responseBody: unknown }) {
    super(`Square could not ${operation}: ${describe({ status, responseBody })}`);
    this.name = 'SquareApiError';
    this.status = status;
    this.code = firstError(responseBody)?.code;
    this.responseBody = responseBody;
  }
}

async function request<T>({
  auth,
  method,
  path,
  query,
  body,
  operation,
}: {
  auth: SquareAuth;
  method: HttpMethod;
  path: string[];
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  operation: string;
}): Promise<T> {
  const url = `${BASE_URL}/${path.map((part, index) => (index === 0 ? part : segment({ value: part, label: 'ID' }))).join('/')}`;
  const queryParams = toQueryParams(query);
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await httpClient.sendRequest<T>({
        method,
        url,
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          'Square-Version': SQUARE_VERSION,
          Accept: 'application/json',
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        queryParams,
        body,
        timeout: REQUEST_TIMEOUT_MS,
        followRedirects: false,
      });
      if (response.status >= 300) {
        throw new SquareApiError({ operation, status: response.status, responseBody: 'Square answered with an unexpected redirect.' });
      }
      return response.body;
    } catch (error) {
      if (error instanceof SquareApiError) {
        throw error;
      }
      const status = statusOf(error);
      if (status === undefined) {
        throw error;
      }
      if (status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
        await sleep(RATE_LIMIT_BASE_DELAY_MS * 2 ** attempt + Math.floor(Math.random() * 250));
        continue;
      }
      throw new SquareApiError({ operation, status, responseBody: responseBodyOf(error) });
    }
  }
}

function segment({ value, label }: { value: unknown; label: string }): string {
  const text = typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
  if (text.length === 0) {
    throw new Error(`${label} is required.`);
  }
  if (text === '.' || text === '..' || text.includes('/') || text.includes('\\') || text.includes('?') || text.includes('#')) {
    throw new Error(`${label} "${text.slice(0, 80)}" is not valid. Use the Square ID only.`);
  }
  return encodeURIComponent(text);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

async function resolveLocation({ auth, locationId }: { auth: SquareAuth; locationId?: string }): Promise<Record<string, unknown>> {
  const id = typeof locationId === 'string' && locationId.trim().length > 0 ? locationId.trim() : 'main';
  const body = await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: ['v2', 'locations', id],
    operation: `read location "${id}"`,
  });
  const location = isRecord(body) ? body['location'] : undefined;
  if (!isRecord(location) || typeof location['id'] !== 'string') {
    throw new Error('Square returned an unexpected location response.');
  }
  return location;
}

function toQueryParams(query: Record<string, string | number | boolean | undefined> | undefined): QueryParams | undefined {
  if (!query) {
    return undefined;
  }
  const entries = Object.entries(query).filter((entry): entry is [string, string | number | boolean] => entry[1] !== undefined && entry[1] !== '');
  return entries.length === 0 ? undefined : Object.fromEntries(entries.map(([key, value]) => [key, String(value)]));
}

function firstError(responseBody: unknown): SquareErrorItem | undefined {
  if (!isRecord(responseBody) || !Array.isArray(responseBody['errors'])) {
    return undefined;
  }
  const first = responseBody['errors'].find(isRecord);
  if (!first) {
    return undefined;
  }
  return {
    code: typeof first['code'] === 'string' ? first['code'] : undefined,
    detail: typeof first['detail'] === 'string' ? first['detail'] : undefined,
    field: typeof first['field'] === 'string' ? first['field'] : undefined,
  };
}

function vendorText(responseBody: unknown): string {
  if (isRecord(responseBody) && Array.isArray(responseBody['errors'])) {
    const parts = responseBody['errors'].filter(isRecord).slice(0, 3).map((item) => {
      const code = typeof item['code'] === 'string' ? item['code'] : 'ERROR';
      const detail = typeof item['detail'] === 'string' ? `: ${item['detail']}` : '';
      const field = typeof item['field'] === 'string' ? ` (field ${item['field']})` : '';
      return `${code}${detail}${field}`;
    });
    if (parts.length > 0) {
      return parts.join('; ').slice(0, MAX_ERROR_TEXT);
    }
  }
  if (typeof responseBody === 'string' && responseBody.trim().length > 0) {
    return responseBody.trim().slice(0, MAX_ERROR_TEXT);
  }
  if (isRecord(responseBody)) {
    return JSON.stringify(responseBody).slice(0, MAX_ERROR_TEXT);
  }
  return 'no details returned';
}

function missingScopes(detail: string | undefined): string | undefined {
  if (!detail) {
    return undefined;
  }
  const match = /scopes?:\s*([A-Z_,\s]+)/.exec(detail);
  return match ? match[1].trim().replace(/[,\s]+$/, '') : undefined;
}

function describe({ status, responseBody }: { status: number; responseBody: unknown }): string {
  const detail = vendorText(responseBody);
  const first = firstError(responseBody);
  if (status === 401) {
    return `the Square connection has expired or was revoked. Reconnect Square and try again. (${detail})`;
  }
  if (status === 403 && first?.code === 'INSUFFICIENT_SCOPES') {
    const scopes = missingScopes(first.detail);
    return `this connection is missing the Square permission${scopes ? ` ${scopes}` : ''}. Reconnect your Square connection (connections created before piece version 1.0.0 lack the newer permissions) and approve the requested permissions, then run the step again.`;
  }
  if (status === 404) {
    return `not found. Check the ID; it must belong to the connected Square account. (${detail})`;
  }
  if (status === 409 || first?.code === 'VERSION_MISMATCH') {
    return `the record changed in Square while this step ran. Run the step again to use the latest version. (${detail})`;
  }
  if (status === 429) {
    return `Square rate limit reached after several retries; try again in a minute. (${detail})`;
  }
  return `HTTP ${status}. ${detail}`;
}

function statusOf(error: unknown): number | undefined {
  if (!(error instanceof Error)) {
    return undefined;
  }
  const response: unknown = Reflect.get(error, 'response');
  if (isRecord(response) && typeof response['status'] === 'number') {
    return response['status'];
  }
  return undefined;
}

function responseBodyOf(error: unknown): unknown {
  if (!(error instanceof Error)) {
    return undefined;
  }
  const response: unknown = Reflect.get(error, 'response');
  return isRecord(response) ? response['body'] : undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const squareClient = {
  request,
  segment,
  isRecord,
  resolveLocation,
  BASE_URL,
  SQUARE_VERSION,
};

export type SquareAuth = { access_token: string; data?: Record<string, unknown> };

type SquareErrorItem = { code: string | undefined; detail: string | undefined; field: string | undefined };
