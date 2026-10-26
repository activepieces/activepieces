import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.hunter.io/v2';

export class HunterApiError extends Error {
  readonly status: number;
  readonly errorId: string | undefined;
  readonly responseBody: unknown;

  constructor({ operation, status, responseBody }: { operation: string; status: number; responseBody: unknown }) {
    super(`Hunter ${operation} failed (${status}): ${describeStatus({ status, responseBody })}`);
    this.name = 'HunterApiError';
    this.status = status;
    this.errorId = vendorErrorId(responseBody);
    this.responseBody = responseBody;
  }
}

export function isRecord(value: unknown): value is HunterRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function vendorErrorId(responseBody: unknown): string | undefined {
  const first = firstError(responseBody);
  return first && typeof first['id'] === 'string' ? first['id'] : undefined;
}

export function vendorMessage(responseBody: unknown): string {
  if (typeof responseBody === 'string' && responseBody.trim() !== '') {
    return responseBody.slice(0, MAX_ERROR_TEXT);
  }
  if (!isRecord(responseBody)) {
    return 'no details returned';
  }
  const errors = Array.isArray(responseBody['errors']) ? responseBody['errors'].filter(isRecord) : [];
  const parts = errors
    .map((error) => [error['id'], error['details']].filter((part) => typeof part === 'string' && part !== '').join(': '))
    .filter((text) => text !== '');
  return (parts.length > 0 ? parts.join(' - ') : JSON.stringify(responseBody)).slice(0, MAX_ERROR_TEXT);
}

export function isNotFound(error: unknown): boolean {
  return error instanceof HunterApiError ? error.status === 404 : statusOf(error) === 404;
}

export function apiKeyOf(auth: unknown): string {
  const raw = typeof auth === 'string' ? auth : isRecord(auth) ? auth['secret_text'] : undefined;
  return String(raw ?? '').trim();
}

export function authHeaders(apiKey: string): Record<string, string> {
  return { 'X-API-KEY': apiKey.trim() };
}

export function verifiedTlsDispatcher(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
  return verifiedTlsAgent;
}

export function optionalText(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const text = String(value).trim();
  return text === '' ? undefined : text;
}

export function requireText({ value, label }: { value: unknown; label: string }): string {
  const text = optionalText(value);
  if (text === undefined) {
    throw new Error(`${label} is required.`);
  }
  return text;
}

export function numericId({ value, label }: { value: unknown; label: string }): number {
  const text = requireText({ value, label });
  if (!/^\d{1,15}$/.test(text) || Number(text) < 1) {
    throw new Error(`${label} must be a positive whole number (got "${text.slice(0, 50)}").`);
  }
  return Number(text);
}

export function optionalInteger({ value, label, min, max }: { value: unknown; label: string; min: number; max: number }): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new Error(`${label} must be a whole number between ${min} and ${max}.`);
  }
  return number;
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

export const hunterApi = { request, sleep };

let verifiedTlsAgent: Promise<unknown> | undefined;

const REQUEST_TIMEOUT_MS = 60_000;

const RATE_LIMIT_RETRY_DELAYS_MS = [2_000, 5_000];

const MAX_ERROR_TEXT = 500;

function firstError(responseBody: unknown): HunterRecord | undefined {
  if (!isRecord(responseBody) || !Array.isArray(responseBody['errors'])) {
    return undefined;
  }
  return responseBody['errors'].find(isRecord);
}

function describeStatus({ status, responseBody }: { status: number; responseBody: unknown }): string {
  const detail = vendorMessage(responseBody);
  switch (status) {
    case 401:
      return `the API key is invalid or was revoked. ${detail}`;
    case 403:
      return `Hunter rate limit reached or the feature is not on your plan; wait a moment and try again. ${detail}`;
    case 404:
      return `not found. ${detail}`;
    case 429:
      return `your Hunter plan's monthly credits (usage limit) are used up; upgrade or wait for the reset date shown by Get Account. ${detail}`;
    case 451:
      return `the owner of this email asked Hunter to stop processing their data. ${detail}`;
    default:
      return detail;
  }
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

function isRateLimit({ status, responseBody }: { status: number; responseBody: unknown }): boolean {
  if (status !== 403) {
    return false;
  }
  const id = vendorErrorId(responseBody);
  return id === undefined || id === 'too_many_requests' || id === 'rate_limit_reached' || /rate/i.test(vendorMessage(responseBody));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request<T = HunterRecord>({ apiKey, method, path, operation, query, body, wait = sleep }: HunterRequest): Promise<HunterResponse<T>> {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('..')) {
    throw new Error(`Internal error: Hunter path must be relative (${operation}).`);
  }
  const httpRequest: HttpRequest = {
    method,
    url: `${BASE_URL}${path}${buildQuery(query)}`,
    headers: { ...authHeaders(apiKey), Accept: 'application/json' },
    timeout: REQUEST_TIMEOUT_MS,
    followRedirects: false,
  };
  if (body !== undefined) {
    httpRequest.body = body;
    httpRequest.headers = { ...httpRequest.headers, 'Content-Type': 'application/json' };
  }
  const dispatcher = await verifiedTlsDispatcher();
  for (let attempt = 0; ; attempt++) {
    let status: number;
    let responseBody: unknown;
    try {
      const response = await httpClient.sendRequest<T>(httpRequest, { dispatcher });
      if (response.status < 300) {
        return { status: response.status, body: response.body };
      }
      status = response.status;
      responseBody = response.body;
    } catch (error) {
      const errorStatus = statusOf(error);
      if (errorStatus === undefined) {
        throw error;
      }
      status = errorStatus;
      responseBody = responseBodyOf(error);
    }
    if (isRateLimit({ status, responseBody }) && attempt < RATE_LIMIT_RETRY_DELAYS_MS.length) {
      await wait(RATE_LIMIT_RETRY_DELAYS_MS[attempt]);
      continue;
    }
    throw new HunterApiError({ operation, status, responseBody });
  }
}

export type HunterRecord = Record<string, unknown>;

export type QueryValue = string | number | boolean | string[] | undefined | null;

export type HunterRequest = {
  apiKey: string;
  method: HttpMethod;
  path: string;
  operation: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
  wait?: (ms: number) => Promise<void>;
};

export type HunterResponse<T> = {
  status: number;
  body: T;
};
