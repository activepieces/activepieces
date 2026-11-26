import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';

export class ApolloApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly responseBody: unknown;

  constructor({ operation, status, responseBody }: { operation: string; status: number; responseBody: unknown }) {
    super(`Apollo ${operation} failed (${status}): ${describeFailure({ status, responseBody })}`);
    this.name = 'ApolloApiError';
    this.status = status;
    this.code = vendorErrorCode(responseBody);
    this.responseBody = responseBody;
  }
}

export function isRecord(value: unknown): value is ApolloRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function recordsOf(value: unknown): ApolloRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

export function apiKeyOf(auth: unknown): string {
  const raw = typeof auth === 'string' ? auth : isRecord(auth) ? auth['secret_text'] : undefined;
  return String(raw ?? '').trim();
}

export function verifiedTlsDispatcher(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
  return verifiedTlsAgent;
}

export function buildQuery(query: Record<string, QueryValue> | undefined): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== '') {
          params.append(key, item);
        }
      }
    } else if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  }
  const text = params.toString();
  return text === '' ? '' : `?${text}`;
}

export function vendorErrorCode(responseBody: unknown): string | undefined {
  const body = parsedBody(responseBody);
  if (!isRecord(body)) {
    return undefined;
  }
  const details = body['error_details'];
  if (isRecord(details) && typeof details['code'] === 'string') {
    return details['code'];
  }
  return typeof body['error_code'] === 'string' ? body['error_code'] : undefined;
}

export function vendorMessage(responseBody: unknown): string {
  const body = parsedBody(responseBody);
  if (typeof body === 'string') {
    return body.trim() === '' ? 'no details returned' : body.trim().slice(0, MAX_ERROR_TEXT);
  }
  if (!isRecord(body)) {
    return 'no details returned';
  }
  const details = body['error_details'];
  const candidates = [isRecord(details) ? details['message'] : undefined, body['error'], body['error_message'], body['message']];
  const text = candidates.find((candidate): candidate is string => typeof candidate === 'string' && candidate.trim() !== '');
  return (text ?? JSON.stringify(body)).slice(0, MAX_ERROR_TEXT);
}

export function isScopeDenied(error: unknown): boolean {
  return error instanceof ApolloApiError && error.status === 403 && SCOPE_DENIED_CODES.includes(error.code ?? '');
}

export function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

let verifiedTlsAgent: Promise<unknown> | undefined;

const REQUEST_TIMEOUT_MS = 60_000;

const MAX_ERROR_TEXT = 500;

const SCOPE_DENIED_CODES = ['API_INACCESSIBLE', 'AUTH.AUTHORIZATION.ENDPOINT_ACCESS_DENIED', 'ENDPOINT_ACCESS_DENIED'];

function parsedBody(responseBody: unknown): unknown {
  if (typeof responseBody !== 'string') {
    return responseBody;
  }
  const trimmed = responseBody.trim();
  if (!trimmed.startsWith('{')) {
    return responseBody;
  }
  try {
    const parsed: unknown = JSON.parse(trimmed);
    return parsed;
  } catch {
    return responseBody;
  }
}

function describeFailure({ status, responseBody }: { status: number; responseBody: unknown }): string {
  const detail = vendorMessage(responseBody);
  const code = vendorErrorCode(responseBody);
  if (status === 403 && SCOPE_DENIED_CODES.includes(code ?? '')) {
    const planText = planLimitText(responseBody);
    if (planText !== undefined) {
      return planText;
    }
    return `${detail} This API key's scope does not include this endpoint: use a master API key, or add the endpoint to the key in Apollo (Settings > Integrations > API Keys).`;
  }
  if (status === 429) {
    const body = parsedBody(responseBody);
    const details = isRecord(body) && isRecord(body['error_details']) ? body['error_details'] : undefined;
    const context = details && isRecord(details['context']) ? details['context'] : undefined;
    const window = context && typeof context['window'] === 'string' ? ` Limit window: ${context['window']}.` : '';
    const retryAfter = retryAfterSeconds(details);
    const wait = retryAfter === undefined ? '' : ` Apollo suggests retrying after ${retryAfter} seconds.`;
    return `${detail}${window}${wait}`;
  }
  return detail;
}

function planLimitText(responseBody: unknown): string | undefined {
  const body = parsedBody(responseBody);
  const legacy = isRecord(body) ? body['error'] : undefined;
  if (typeof legacy !== 'string' || !/\bplan\b/i.test(legacy)) {
    return undefined;
  }
  return legacy.trim().slice(0, MAX_ERROR_TEXT);
}

function retryAfterSeconds(details: ApolloRecord | undefined): number | undefined {
  if (!details) {
    return undefined;
  }
  const suggestions = details['suggestions'];
  const holders = [details, ...(Array.isArray(suggestions) ? suggestions.filter(isRecord) : isRecord(suggestions) ? [suggestions] : [])];
  for (const holder of holders) {
    const value = holder['retry_after_seconds'];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

function statusOf(error: unknown): number | undefined {
  if (!isRecord(error) && !(error instanceof Error)) {
    return undefined;
  }
  const response: unknown = Reflect.get(error, 'response');
  return isRecord(response) && typeof response['status'] === 'number' ? response['status'] : undefined;
}

function responseBodyOf(error: unknown): unknown {
  if (!isRecord(error) && !(error instanceof Error)) {
    return undefined;
  }
  const response: unknown = Reflect.get(error, 'response');
  return isRecord(response) ? response['body'] : undefined;
}

async function request<T = ApolloRecord>({ apiKey, method, path, operation, query, body }: ApolloRequest): Promise<T> {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('..')) {
    throw new Error(`Internal error: Apollo path must be relative (${operation}).`);
  }
  if (apiKey === '') {
    throw new Error('Apollo API key is missing. Reconnect the Apollo connection.');
  }
  const httpRequest: HttpRequest = {
    method,
    url: `${APOLLO_BASE_URL}${path}${buildQuery(query)}`,
    headers: { 'x-api-key': apiKey, Accept: 'application/json', 'Cache-Control': 'no-cache' },
    timeout: REQUEST_TIMEOUT_MS,
    followRedirects: false,
    redactBodyInErrors: true,
  };
  if (body !== undefined) {
    httpRequest.body = body;
    httpRequest.headers = { ...httpRequest.headers, 'Content-Type': 'application/json' };
  }
  const dispatcher = await verifiedTlsDispatcher();
  let status: number;
  let responseBody: unknown;
  try {
    const response = await httpClient.sendRequest<T>(httpRequest, { dispatcher });
    if (response.status < 300) {
      return response.body;
    }
    status = response.status;
    responseBody = response.body;
  } catch (error) {
    const errorStatus = statusOf(error);
    if (errorStatus === undefined) {
      throw new Error(`Apollo ${operation} failed: could not reach Apollo (${errorText(error).slice(0, 200)}).`);
    }
    status = errorStatus;
    responseBody = responseBodyOf(error);
  }
  throw new ApolloApiError({ operation, status, responseBody });
}

export const APOLLO_BASE_URL = 'https://api.apollo.io/api/v1';

export const apolloApi = { request };

export type ApolloRecord = Record<string, unknown>;

export type QueryValue = string | number | boolean | string[] | undefined | null;

export type ApolloRequest = {
  apiKey: string;
  method: HttpMethod;
  path: string;
  operation: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
};
