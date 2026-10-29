import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';

export const SENDIT_ORIGIN = 'https://sendit.infiniteappsai.com';

export const BASE_URL = `${SENDIT_ORIGIN}/api/v1`;

export class SendItApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({ operation, status, responseBody }: { operation: string; status: number; responseBody: unknown }) {
    super(`SendIt ${operation} failed (${status}): ${describeStatus({ status, responseBody })}`);
    this.name = 'SendItApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

export function isRecord(value: unknown): value is SendItRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function vendorMessage(responseBody: unknown): string {
  if (typeof responseBody === 'string' && responseBody.trim() !== '') {
    return responseBody.slice(0, MAX_ERROR_TEXT);
  }
  if (!isRecord(responseBody)) {
    return 'no details returned';
  }
  const parts: string[] = [];
  const add = (value: unknown) => {
    if (typeof value === 'string' && value.trim() !== '' && !parts.includes(value)) {
      parts.push(value);
    }
  };
  add(responseBody['error']);
  add(responseBody['message']);
  if (isRecord(responseBody['error'])) {
    add(responseBody['error']['message']);
  }
  if (Array.isArray(responseBody['errors'])) {
    for (const item of responseBody['errors']) {
      add(isRecord(item) ? item['message'] : item);
    }
  }
  return (parts.length > 0 ? parts.join(' - ') : JSON.stringify(responseBody)).slice(0, MAX_ERROR_TEXT);
}

export function isNotFound(error: unknown): boolean {
  return statusOf(error) === 404;
}

export function apiKeyOf(auth: unknown): string {
  const raw = typeof auth === 'string' ? auth : isRecord(auth) ? auth['secret_text'] : undefined;
  return String(raw ?? '').trim();
}

export function authHeaders(apiKey: string): Record<string, string> {
  return { Authorization: `Bearer ${apiKey.trim()}` };
}

export function verifiedTlsDispatcher(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
  return verifiedTlsAgent;
}

export function requireText({ value, label }: { value: unknown; label: string }): string {
  const text = optionalText(value);
  if (text === undefined) {
    throw new Error(`${label} is required.`);
  }
  return text;
}

export function optionalText(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const text = String(value).trim();
  return text === '' ? undefined : text;
}

export function pathId({ value, label }: { value: unknown; label: string }): string {
  const text = requireText({ value, label });
  if (text === '.' || text === '..') {
    throw new Error(`${label} "${text}" is not valid.`);
  }
  return encodeURIComponent(text);
}

export function readList({ body, key }: { body: unknown; key: string }): SendItRecord[] {
  const list = isRecord(body) ? body[key] : undefined;
  return Array.isArray(list) ? list.filter(isRecord) : [];
}

export const sendItApi = { request, sleep };

let verifiedTlsAgent: Promise<unknown> | undefined;

const REQUEST_TIMEOUT_MS = 60_000;

const RATE_LIMIT_RETRY_DELAYS_MS = [10_000, 20_000];

const MAX_ERROR_TEXT = 500;

function describeStatus({ status, responseBody }: { status: number; responseBody: unknown }): string {
  const detail = vendorMessage(responseBody);
  switch (status) {
    case 401:
      return `the API key is invalid or was revoked. ${detail}`;
    case 403:
      return `SendIt refused the request (the feature may not be on your plan, or the post quota is used up). ${detail}`;
    case 404:
      return `not found, or not in a state that allows this. ${detail}`;
    case 429:
      return `SendIt rate limit reached; try again in a minute. ${detail}`;
    default:
      return detail;
  }
}

function statusOf(error: unknown): number | undefined {
  if (error instanceof SendItApiError) {
    return error.status;
  }
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toQuery(query: Record<string, QueryValue> | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      result[key] = String(value);
    }
  }
  return result;
}

async function request<T = SendItRecord>({ apiKey, method, path, operation, query, body, headers, wait = sleep }: SendItRequest): Promise<T> {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('..')) {
    throw new Error(`Internal error: SendIt path must be relative (${operation}).`);
  }
  const httpRequest: HttpRequest = {
    method,
    url: `${BASE_URL}${path}`,
    headers: { ...authHeaders(apiKey), Accept: 'application/json', ...headers },
    queryParams: toQuery(query),
    timeout: REQUEST_TIMEOUT_MS,
    followRedirects: false,
  };
  if (body !== undefined) {
    httpRequest.body = body;
    httpRequest.headers = { ...httpRequest.headers, 'Content-Type': 'application/json' };
  }
  const dispatcher = await verifiedTlsDispatcher();
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await httpClient.sendRequest<T>(httpRequest, { dispatcher });
      if (response.status >= 300) {
        throw new SendItApiError({ operation, status: response.status, responseBody: response.body });
      }
      return response.body;
    } catch (error) {
      if (error instanceof SendItApiError) {
        throw error;
      }
      const status = statusOf(error);
      if (status === undefined) {
        throw error;
      }
      if (status === 429 && attempt < RATE_LIMIT_RETRY_DELAYS_MS.length) {
        await wait(RATE_LIMIT_RETRY_DELAYS_MS[attempt]);
        continue;
      }
      throw new SendItApiError({ operation, status, responseBody: responseBodyOf(error) });
    }
  }
}

export type SendItRecord = Record<string, unknown>;

type QueryValue = string | number | boolean | undefined | null;

export type SendItRequest = {
  apiKey: string;
  method: HttpMethod;
  path: string;
  operation: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
  headers?: Record<string, string>;
  wait?: (ms: number) => Promise<void>;
};
