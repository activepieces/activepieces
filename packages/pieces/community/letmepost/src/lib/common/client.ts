import {
  httpClient,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';
import type { LetmepostAuth } from './auth';

const DEFAULT_BASE_URL = 'https://api.letmepost.dev';
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_ERROR_TEXT = 500;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let verifiedTlsAgent: Promise<unknown> | undefined;

class LetmepostApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseBody: unknown
  ) {
    super(message);
    this.name = 'LetmepostApiError';
  }
}

function verifiedTls(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(
    ({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } })
  );
  return verifiedTlsAgent;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text === '' ? undefined : text;
}

function displayBaseUrl(raw: unknown): string {
  const text = optionalText(raw);
  return text === undefined ? DEFAULT_BASE_URL : text.replace(/\/+$/, '');
}

function checkBaseUrl(raw: unknown): { ok: true; baseUrl: string } | { ok: false; error: string } {
  const baseUrl = displayBaseUrl(raw);
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    return {
      ok: false,
      error: `The Base URL "${baseUrl.slice(0, 100)}" is not a valid URL. Use https://api.letmepost.dev or your self-hosted origin, starting with https://.`,
    };
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { ok: false, error: 'The Base URL must start with https:// (or http:// for a local self-hosted server).' };
  }
  if (url.username !== '' || url.password !== '') {
    return { ok: false, error: 'The Base URL must not contain a user name or password.' };
  }
  if (url.search !== '' || url.hash !== '') {
    return { ok: false, error: 'The Base URL must not contain a query string or a # fragment.' };
  }
  return { ok: true, baseUrl };
}

function baseUrlOf(raw: unknown): string {
  const checked = checkBaseUrl(raw);
  if (!checked.ok) {
    throw new Error(checked.error);
  }
  return checked.baseUrl;
}

function apiKeyOf(raw: unknown): string {
  const key = optionalText(raw);
  if (key === undefined) {
    throw new Error('The letmepost connection has no API key. Reconnect it with a key from the dashboard (API keys).');
  }
  return key;
}

function segment({ value, label }: { value: unknown; label: string }): string {
  const text = optionalText(value);
  if (text === undefined || text === '.' || text === '..') {
    throw new Error(`${label} is required.`);
  }
  return encodeURIComponent(text);
}

function uuidOf({ value, label }: { value: unknown; label: string }): string {
  const text = optionalText(value);
  if (text === undefined) {
    throw new Error(`${label} is required.`);
  }
  if (!UUID_PATTERN.test(text)) {
    throw new Error(`${label} must be a letmepost id in UUID form, like 01a1a9d5-2ba5-7711-a8fb-aa4255e1569a. Got "${text.slice(0, 60)}".`);
  }
  return text;
}

function optionalUuid({ value, label }: { value: unknown; label: string }): string | undefined {
  return optionalText(value) === undefined ? undefined : uuidOf({ value, label });
}

function buildQuery(query?: Record<string, QueryValue>): QueryParams {
  const result: QueryParams = {};
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null) continue;
    const text = Array.isArray(value) ? value.join(',') : String(value);
    if (text !== '') {
      result[key] = text;
    }
  }
  return result;
}

function vendorMessage(body: unknown): string | undefined {
  const envelope = isRecord(body) && isRecord(body['error']) ? body['error'] : undefined;
  if (envelope !== undefined) {
    const code = optionalText(envelope['code']);
    const message = optionalText(envelope['message']);
    const rule = optionalText(envelope['rule']);
    const remediation = optionalText(envelope['remediation']);
    const requestId = optionalText(envelope['requestId']);
    const lead = code !== undefined && message !== undefined ? `${code}: ${message}` : code ?? message;
    const parts = [
      lead !== undefined && (rule ?? remediation ?? requestId) !== undefined && !/[.!?]$/.test(lead) ? `${lead}.` : lead,
      rule !== undefined ? `Rule: ${rule}.` : undefined,
      remediation,
      requestId !== undefined ? `Request ID: ${requestId}.` : undefined,
    ].filter((part): part is string => part !== undefined);
    if (parts.length > 0) {
      return parts.join(' ').slice(0, MAX_ERROR_TEXT);
    }
  }
  if (isRecord(body)) {
    const message = optionalText(body['message']);
    if (message !== undefined) return message.slice(0, MAX_ERROR_TEXT);
  }
  const text = optionalText(body);
  return text === undefined ? undefined : text.slice(0, MAX_ERROR_TEXT);
}

function failureOf(error: unknown): { status: number; body: unknown } | null {
  if (error === null || typeof error !== 'object') return null;
  const response = Reflect.get(error, 'response');
  if (!isRecord(response)) return null;
  const status = response['status'];
  return typeof status === 'number' ? { status, body: response['body'] } : null;
}

function toApiError({ status, body, operation }: { status: number; body: unknown; operation: string }): LetmepostApiError {
  const vendor = vendorMessage(body);
  return new LetmepostApiError(
    `letmepost could not ${operation} (HTTP ${status})${vendor !== undefined ? `: ${vendor}` : '.'}`,
    status,
    body
  );
}

async function send<T>({
  baseUrl,
  apiKey,
  method,
  path,
  query,
  body,
  headers,
  redactBody,
  timeoutMs,
  operation,
}: SendParams): Promise<T> {
  const timeout = timeoutMs ?? REQUEST_TIMEOUT_MS;
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const hasBody = body !== undefined && method !== HttpMethod.GET && method !== HttpMethod.DELETE;
  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${apiKey}`,
    ...headers,
  };
  if (hasBody && !isForm) {
    requestHeaders['Content-Type'] = 'application/json';
  }
  const dispatcher = await verifiedTls();
  try {
    const response = await httpClient.sendRequest<T>(
      {
        method,
        url: `${baseUrl}${path}`,
        headers: requestHeaders,
        queryParams: buildQuery(query),
        body: hasBody ? body : undefined,
        timeout,
        followRedirects: false,
        redactBodyInErrors: redactBody === true,
      },
      { dispatcher }
    );
    if (response.status >= 300) {
      throw new LetmepostApiError(
        `letmepost could not ${operation} (HTTP ${response.status}): the server answered with a redirect. Check the Base URL of the connection.`,
        response.status,
        undefined
      );
    }
    return response.body;
  } catch (error) {
    if (error instanceof LetmepostApiError) throw error;
    const failure = failureOf(error);
    if (failure !== null) {
      throw toApiError({ ...failure, operation });
    }
    if (isAbort(error)) {
      throw new Error(`letmepost could not ${operation}: the request timed out after ${Math.round(timeout / 1000)} s. Try again, or use a smaller file or fewer items.`);
    }
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`letmepost could not ${operation}: could not reach ${baseUrl} (${reason}). Check the Base URL of the connection and your network.`);
  }
}

async function request<T>({ auth, ...rest }: RequestParams): Promise<T> {
  return send<T>({
    ...rest,
    baseUrl: baseUrlOf(auth.props.base_url),
    apiKey: apiKeyOf(auth.props.api_key),
  });
}

function isAbort(error: unknown): boolean {
  if (error === null || typeof error !== 'object') return false;
  const name = Reflect.get(error, 'name');
  return name === 'AbortError' || name === 'TimeoutError';
}

function isFailedBatch(body: unknown): boolean {
  return isRecord(body) && body['status'] === 'failed';
}

function batchFailureError(body: unknown): LetmepostApiError {
  const results = isRecord(body) && Array.isArray(body['results']) ? body['results'] : [];
  const lines = results.filter(isRecord).map((result) => {
    const target = [optionalText(result['platform']), optionalText(result['accountId'])]
      .filter((part): part is string => part !== undefined)
      .join(' ');
    const detail = vendorMessage({ error: result['error'] }) ?? `status ${String(result['status'])}`;
    return `${target === '' ? 'target' : target}: ${detail}`;
  });
  const summary = lines.length > 0 ? ` ${lines.join(' | ')}` : '';
  return new LetmepostApiError(
    `letmepost did not publish the post: every target failed.${summary}`.slice(0, MAX_ERROR_TEXT * 4),
    200,
    body
  );
}

function withPostIds(body: unknown): Record<string, unknown> {
  const record = isRecord(body) ? body : {};
  const results = Array.isArray(record['results']) ? record['results'] : [];
  const postIds = results
    .filter(isRecord)
    .map((result) => result['postId'])
    .filter((id): id is string => typeof id === 'string' && id !== '');
  return { ...record, postIds };
}

function isFileLike(value: unknown): value is FileLike {
  return value !== null && typeof value === 'object' && Buffer.isBuffer(Reflect.get(value, 'data'));
}

export { LetmepostApiError };

export const letmepostClient = {
  request,
  send,
  checkBaseUrl,
  displayBaseUrl,
  segment,
  uuidOf,
  optionalUuid,
  isRecord,
  optionalText,
  isFailedBatch,
  batchFailureError,
  withPostIds,
  isFileLike,
  verifiedTls,
  DEFAULT_BASE_URL,
};

type QueryValue = string | number | boolean | string[] | undefined | null;

type FileLike = { filename?: unknown; data: Buffer; extension?: unknown };

type SendParams = {
  baseUrl: string;
  apiKey: string;
  method: HttpMethod;
  path: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
  headers?: Record<string, string>;
  redactBody?: boolean;
  timeoutMs?: number;
  operation: string;
};

type RequestParams = Omit<SendParams, 'baseUrl' | 'apiKey'> & {
  auth: LetmepostAuth;
};
