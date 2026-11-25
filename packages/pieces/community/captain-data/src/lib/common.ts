import { httpClient, HttpMethod } from '@activepieces/pieces-common';

class CaptainDataError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({
    message,
    status,
    responseBody,
  }: {
    message: string;
    status: number;
    responseBody: unknown;
  }) {
    super(message);
    this.name = 'CaptainDataError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return undefined;
}

function describeErrorBody({ body }: { body: unknown }): string | undefined {
  if (typeof body === 'string' && body.trim() !== '') {
    return body.slice(0, 500);
  }
  if (!isRecord(body)) {
    return undefined;
  }
  const nested = body['error'];
  if (isRecord(nested)) {
    const details = isRecord(nested['details']) ? nested['details'] : {};
    const retryAfter = readString(details['Retry-After']);
    const summary =
      [readString(nested['status']), readString(nested['message'])]
        .filter((part): part is string => part !== undefined)
        .join(': ') || 'Request failed';
    return retryAfter
      ? `${summary}, retry after ${retryAfter} seconds`
      : summary;
  }
  const message = readString(body['message']);
  const label = readString(body['error_label']);
  if (message && label) {
    return `${label}: ${message}`;
  }
  return message ?? label;
}

function readStatus({ error }: { error: unknown }): number | undefined {
  if (!isRecord(error)) {
    return undefined;
  }
  const response = error['response'];
  if (isRecord(response) && typeof response['status'] === 'number') {
    return response['status'];
  }
  return undefined;
}

function readResponseBody({ error }: { error: unknown }): unknown {
  if (!isRecord(error)) {
    return undefined;
  }
  const response = error['response'];
  return isRecord(response) ? response['body'] : undefined;
}

function toCaptainDataError({
  error,
  operation,
  invalidInputHint,
  notFoundHint,
}: {
  error: unknown;
  operation: string;
  invalidInputHint?: string;
  notFoundHint?: string;
}): CaptainDataError {
  const status = readStatus({ error });
  if (status !== undefined) {
    const responseBody = readResponseBody({ error });
    const detail = describeErrorBody({ body: responseBody });
    const hintText =
      invalidInputHint && (status === 400 || status === 424)
        ? invalidInputHint
        : notFoundHint && status === 404
        ? notFoundHint
        : undefined;
    const base = `Captain Data ${operation} failed (${status})${
      detail ? `: ${detail}` : ''
    }`;
    const separator = /[.!?]$/.test(base) ? ' ' : '. ';
    return new CaptainDataError({
      message: hintText ? `${base}${separator}${hintText}` : base,
      status,
      responseBody,
    });
  }
  const reason =
    error instanceof Error && error.name === 'AbortError'
      ? 'the request timed out'
      : error instanceof Error
      ? error.message
      : 'network error';
  return new CaptainDataError({
    message: `Captain Data ${operation} failed: ${reason}`,
    status: 0,
    responseBody: undefined,
  });
}

function buildQueryParams({
  queryParams,
}: {
  queryParams?: Record<string, string | boolean | undefined>;
}): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(queryParams ?? {})) {
    if (value === undefined) {
      continue;
    }
    if (typeof value === 'boolean') {
      result[key] = value ? 'true' : 'false';
      continue;
    }
    const trimmed = value.trim();
    if (trimmed !== '') {
      result[key] = trimmed;
    }
  }
  return result;
}

function readHeader({
  headers,
  name,
}: {
  headers: Record<string, string | string[] | undefined> | undefined;
  name: string;
}): string | undefined {
  if (!headers) {
    return undefined;
  }
  const match = Object.entries(headers).find(
    ([key]) => key.toLowerCase() === name.toLowerCase()
  );
  const value = match?.[1];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function cursorFromHeader({
  value,
}: {
  value: string | undefined;
}): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.includes('cursor=')) {
    return parseNextCursor({ header: trimmed });
  }
  return trimmed;
}

function parseNextCursor({
  header,
}: {
  header: string | undefined;
}): string | null {
  if (!header || header.trim() === '') {
    return null;
  }
  try {
    const url = new URL(header.trim(), CAPTAIN_DATA_BASE_URL);
    const cursor = url.searchParams.get('cursor');
    return cursor && cursor !== '' ? cursor : null;
  } catch {
    return null;
  }
}

function requireText({
  value,
  field,
}: {
  value: unknown;
  field: string;
}): string {
  const text = optionalText({ value });
  if (text === undefined) {
    throw new Error(`${field} is required.`);
  }
  return text;
}

function optionalText({ value }: { value: unknown }): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }
  return value.trim();
}

async function request({
  apiKey,
  path,
  operation,
  queryParams,
  invalidInputHint,
  notFoundHint,
  timeoutMs = REQUEST_TIMEOUT_MS,
  retryTransientNotFound = false,
}: {
  apiKey: string;
  path: string;
  operation: string;
  queryParams?: Record<string, string | boolean | undefined>;
  invalidInputHint?: string;
  notFoundHint?: string;
  timeoutMs?: number;
  retryTransientNotFound?: boolean;
}): Promise<{
  body: unknown;
  headers: Record<string, string | string[] | undefined> | undefined;
}> {
  const first = await sendOnce({ apiKey, path, queryParams, timeoutMs });
  const result =
    'error' in first &&
    retryTransientNotFound &&
    isTransientNotFound({ error: first.error })
      ? await sendOnce({ apiKey, path, queryParams, timeoutMs })
      : first;
  if ('error' in result) {
    throw toCaptainDataError({
      error: result.error,
      operation,
      invalidInputHint,
      notFoundHint,
    });
  }
  return result;
}

function isTransientNotFound({ error }: { error: unknown }): boolean {
  const body = readResponseBody({ error });
  return (
    readStatus({ error }) === 424 &&
    isRecord(body) &&
    body['error_label'] === 'STATUS_404'
  );
}

async function sendOnce({
  apiKey,
  path,
  queryParams,
  timeoutMs,
}: {
  apiKey: string;
  path: string;
  queryParams?: Record<string, string | boolean | undefined>;
  timeoutMs: number;
}): Promise<
  | {
      body: unknown;
      headers: Record<string, string | string[] | undefined> | undefined;
    }
  | { error: unknown }
> {
  try {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${CAPTAIN_DATA_BASE_URL}${path}`,
      headers: {
        'X-API-Key': apiKey.trim(),
        Accept: 'application/json',
      },
      queryParams: buildQueryParams({ queryParams }),
      timeout: timeoutMs,
    });
    return { body: response.body, headers: response.headers };
  } catch (error) {
    return { error };
  }
}

async function getObject({
  apiKey,
  path,
  operation,
  queryParams,
  retryTransientNotFound,
}: {
  apiKey: string;
  path: string;
  operation: string;
  queryParams?: Record<string, string | boolean | undefined>;
  retryTransientNotFound?: boolean;
}): Promise<Record<string, unknown>> {
  const { body } = await request({
    apiKey,
    path,
    operation,
    queryParams,
    retryTransientNotFound,
  });
  if (!isRecord(body)) {
    throw new CaptainDataError({
      message: `Captain Data ${operation} failed: unexpected response shape.`,
      status: 200,
      responseBody: body,
    });
  }
  return body;
}

async function getList({
  apiKey,
  path,
  operation,
  queryParams,
  invalidInputHint,
  notFoundHint,
  retryTransientNotFound,
}: {
  apiKey: string;
  path: string;
  operation: string;
  queryParams?: Record<string, string | boolean | undefined>;
  invalidInputHint?: string;
  notFoundHint?: string;
  retryTransientNotFound?: boolean;
}): Promise<{
  items: unknown[];
  next_cursor: string | null;
  has_more: boolean;
}> {
  const { body, headers } = await request({
    apiKey,
    path,
    operation,
    queryParams,
    invalidInputHint,
    notFoundHint,
    retryTransientNotFound,
  });
  const items = requireArray({ body, operation });
  const cursorHeader = readHeader({ headers, name: 'x-cursor-next' });
  const nextCursor =
    cursorFromHeader({ value: cursorHeader }) ??
    parseNextCursor({
      header: readHeader({ headers, name: 'x-pagination-next' }),
    });
  return {
    items,
    next_cursor: nextCursor,
    has_more: nextCursor !== null,
  };
}

async function getItems({
  apiKey,
  path,
  operation,
  queryParams,
  invalidInputHint,
  retryTransientNotFound,
}: {
  apiKey: string;
  path: string;
  operation: string;
  queryParams?: Record<string, string | boolean | undefined>;
  invalidInputHint?: string;
  retryTransientNotFound?: boolean;
}): Promise<{ items: unknown[] }> {
  const { body } = await request({
    apiKey,
    path,
    operation,
    queryParams,
    invalidInputHint,
    retryTransientNotFound,
  });
  return { items: requireArray({ body, operation }) };
}

function requireArray({
  body,
  operation,
}: {
  body: unknown;
  operation: string;
}): unknown[] {
  if (!Array.isArray(body)) {
    throw new CaptainDataError({
      message: `Captain Data ${operation} failed: expected a list in the response.`,
      status: 200,
      responseBody: body,
    });
  }
  return body;
}

function personLookupParams({
  peopleUid,
  liProfileUrl,
}: {
  peopleUid: unknown;
  liProfileUrl: unknown;
}): Record<string, string> {
  const uid = optionalText({ value: peopleUid });
  const url = optionalText({ value: liProfileUrl });
  if (uid && url) {
    throw new Error(
      'Provide either Person UID or LinkedIn Profile URL, not both.'
    );
  }
  if (uid) {
    return { people_uid: uid };
  }
  if (url) {
    return { li_profile_url: url };
  }
  throw new Error('Provide a Person UID or a LinkedIn Profile URL.');
}

const CAPTAIN_DATA_BASE_URL = 'https://api.captaindata.com/v1';
const REQUEST_TIMEOUT_MS = 120000;
const VALIDATE_TIMEOUT_MS = 30000;
const COMPANY_ID_NOT_FOUND_HINT =
  'Check the Company ID: use the uid from Enrich Company or Search Companies, or the numeric li_company_id from Find Company.';
const SALES_NAVIGATOR_QUERY_HINT =
  'The query must use Sales Navigator filter syntax, for example (keywords:CEO). If you passed a cursor, it may have expired (cursors last 24 hours); start again without it.';
const PROFILE_URL_NOT_FOUND_HINT =
  'If Captain Data cannot find this profile URL, run Find Person or Search People and use its uid as Person UID instead.';

const captainDataClient = {
  request,
  getObject,
  getList,
  getItems,
};

const captainDataUtils = {
  parseNextCursor,
  requireText,
  optionalText,
  personLookupParams,
  toCaptainDataError,
};

export {
  CAPTAIN_DATA_BASE_URL,
  VALIDATE_TIMEOUT_MS,
  COMPANY_ID_NOT_FOUND_HINT,
  SALES_NAVIGATOR_QUERY_HINT,
  PROFILE_URL_NOT_FOUND_HINT,
  CaptainDataError,
  captainDataClient,
  captainDataUtils,
};
