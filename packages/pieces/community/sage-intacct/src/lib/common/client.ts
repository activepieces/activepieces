import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.intacct.com/ia/api/v1';
const TIMEOUT_MS = 60_000;
const QUERY_PAGE_SIZE = 100;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readPath({ record, path }: { record: Record<string, unknown>; path: string }): unknown {
  if (path in record) {
    return record[path];
  }
  let current: unknown = record;
  for (const part of path.split('.')) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

function readString({ record, path }: { record: Record<string, unknown>; path: string }): string | null {
  const value = readPath({ record, path });
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
}

function describeVendorError(body: unknown): string | null {
  if (!isRecord(body)) {
    return typeof body === 'string' && body.trim() !== '' ? body.trim().slice(0, 500) : null;
  }
  const result = body['ia::result'];
  const error = isRecord(result) ? result['ia::error'] : body['ia::error'];
  if (!isRecord(error)) {
    const description = body['error_description'] ?? body['error'];
    return typeof description === 'string' ? description : null;
  }
  const parts: string[] = [];
  if (typeof error['message'] === 'string') {
    parts.push(error['message']);
  }
  const details = error['details'];
  if (Array.isArray(details)) {
    for (const detail of details) {
      if (isRecord(detail) && typeof detail['message'] === 'string' && !parts.includes(detail['message'])) {
        parts.push(detail['message']);
      }
    }
  }
  const code = typeof error['code'] === 'string' ? ` [${error['code']}]` : '';
  return parts.length > 0 ? `${parts.join(' ')}${code}` : null;
}

function hintForStatus(status: number): string {
  if (status === 401) {
    return ' Reconnect the Sage Intacct connection.';
  }
  if (status === 403) {
    return ' Check that the Web Services user has permission for this object.';
  }
  if (status === 429) {
    return ' Sage Intacct rate limit reached; try again later.';
  }
  return '';
}

function mapError({ error, operation, mutating }: { error: unknown; operation: string; mutating: boolean }): Error {
  if (error instanceof HttpError) {
    const status = error.response.status;
    const vendor = describeVendorError(error.response.body);
    const message = `Sage Intacct ${operation} failed (HTTP ${status})${vendor ? `: ${vendor}` : '.'}${hintForStatus(status)}`;
    return new SageIntacctError({ message, status, responseBody: error.response.body });
  }
  const reason = error instanceof Error ? error.message : String(error);
  const maybeApplied = mutating ? ' The change may still have been applied; check Sage Intacct before retrying.' : '';
  return new Error(`Sage Intacct ${operation} could not reach the API: ${reason}.${maybeApplied}`);
}

async function request<T>({
  auth,
  method,
  path,
  body,
  queryParams,
  operation,
  mutating,
}: {
  auth: SageIntacctAuthValue;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
  operation: string;
  mutating?: boolean;
}): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body,
      queryParams,
      timeout: TIMEOUT_MS,
      redactBodyInErrors: true,
    });
    return response.body;
  } catch (error) {
    throw mapError({ error, operation, mutating: mutating ?? method !== HttpMethod.GET });
  }
}

function unwrapResult(body: unknown): unknown {
  return isRecord(body) && 'ia::result' in body ? body['ia::result'] : body;
}

function unwrapRecord({ body, operation }: { body: unknown; operation: string }): Record<string, unknown> {
  const result = unwrapResult(body);
  if (!isRecord(result)) {
    throw new Error(`Sage Intacct ${operation} returned an unexpected response.`);
  }
  return result;
}

async function getRecord({ auth, object, key }: { auth: SageIntacctAuthValue; object: string; key: string }): Promise<Record<string, unknown>> {
  const body = await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `/objects/${object}/${encodeURIComponent(key)}`,
    operation: `get ${object}`,
  });
  return unwrapRecord({ body, operation: `get ${object}` });
}

async function createRecord({ auth, object, body }: { auth: SageIntacctAuthValue; object: string; body: Record<string, unknown> }): Promise<Record<string, unknown>> {
  const created = unwrapRecord({
    body: await request<unknown>({ auth, method: HttpMethod.POST, path: `/objects/${object}`, body, operation: `create ${object}` }),
    operation: `create ${object}`,
  });
  return readBack({ auth, object, reference: created });
}

async function updateRecord({ auth, object, key, body }: { auth: SageIntacctAuthValue; object: string; key: string; body: Record<string, unknown> }): Promise<Record<string, unknown>> {
  const updated = unwrapRecord({
    body: await request<unknown>({ auth, method: HttpMethod.PATCH, path: `/objects/${object}/${encodeURIComponent(key)}`, body, operation: `update ${object}` }),
    operation: `update ${object}`,
  });
  return readBack({ auth, object, reference: { ...updated, key: readString({ record: updated, path: 'key' }) ?? key } });
}

async function readBack({ auth, object, reference }: { auth: SageIntacctAuthValue; object: string; reference: Record<string, unknown> }): Promise<Record<string, unknown>> {
  const key = readString({ record: reference, path: 'key' });
  if (!key) {
    return reference;
  }
  try {
    return await getRecord({ auth, object, key });
  } catch {
    return { ...reference, readBackIncomplete: true };
  }
}

async function queryPage({
  auth,
  object,
  fields,
  filters,
  filterExpression,
  orderBy,
  start,
  size,
}: {
  auth: SageIntacctAuthValue;
  object: string;
  fields: string[];
  filters?: QueryFilter[];
  filterExpression?: string;
  orderBy?: QueryOrder[];
  start: number;
  size: number;
}): Promise<QueryPage> {
  const body: Record<string, unknown> = { object, fields, start, size };
  if (filters && filters.length > 0) {
    body['filters'] = filters;
    if (filterExpression !== undefined) {
      body['filterExpression'] = filterExpression;
    }
  }
  if (orderBy && orderBy.length > 0) {
    body['orderBy'] = orderBy;
  }
  const response = await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: '/services/core/query',
    body,
    operation: `query ${object}`,
    mutating: false,
  });
  const result = unwrapResult(response);
  const records = Array.isArray(result) ? result.filter(isRecord) : [];
  const meta = isRecord(response) ? response['ia::meta'] : undefined;
  const next = isRecord(meta) ? meta['next'] : undefined;
  const totalCount = isRecord(meta) && typeof meta['totalCount'] === 'number' ? meta['totalCount'] : null;
  const nextStart = typeof next === 'number' ? next : typeof next === 'string' && /^\d+$/.test(next) ? Number(next) : null;
  return { records, nextStart, totalCount };
}

async function queryAll({
  auth,
  object,
  fields,
  filters,
  filterExpression,
  orderBy,
  limit,
}: {
  auth: SageIntacctAuthValue;
  object: string;
  fields: string[];
  filters?: QueryFilter[];
  filterExpression?: string;
  orderBy?: QueryOrder[];
  limit: number;
}): Promise<{ records: Record<string, unknown>[]; truncated: boolean }> {
  const records: Record<string, unknown>[] = [];
  let start = 1;
  for (;;) {
    const size = Math.min(QUERY_PAGE_SIZE, limit - records.length);
    const page = await queryPage({ auth, object, fields, filters, filterExpression, orderBy, start, size });
    records.push(...page.records.slice(0, limit - records.length));
    if (page.nextStart === null || page.records.length === 0) {
      return { records, truncated: false };
    }
    if (records.length >= limit) {
      return { records, truncated: true };
    }
    start = page.nextStart;
  }
}

export const sageIntacctClient = {
  BASE_URL,
  QUERY_PAGE_SIZE,
  request,
  getRecord,
  createRecord,
  updateRecord,
  queryPage,
  queryAll,
  readPath,
  readString,
  isRecord,
  describeVendorError,
};

export class SageIntacctError extends Error {
  readonly httpStatus: number;
  readonly responseBody: unknown;
  constructor({ message, status, responseBody }: { message: string; status: number; responseBody: unknown }) {
    super(message);
    this.name = 'SageIntacctError';
    this.httpStatus = status;
    this.responseBody = responseBody;
  }
}

export type SageIntacctAuthValue = { access_token: string };
export type QueryFilter = Record<string, Record<string, string | number | boolean | string[]>>;
export type QueryOrder = Record<string, 'asc' | 'desc'>;
export type QueryPage = { records: Record<string, unknown>[]; nextStart: number | null; totalCount: number | null };
