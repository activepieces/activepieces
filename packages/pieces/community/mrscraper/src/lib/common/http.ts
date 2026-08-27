import {
  HttpError,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { tryCatch } from '@activepieces/pieces-framework';

const PRIMARY_BASE_URL = 'https://api.app.mrscraper.com';
const SERP_BASE_URL = 'https://sync.scraper.mrscraper.com';
const RENDERED_BASE_URL = 'https://api.mrscraper.com';
const DEFAULT_TIMEOUT_MS = 120_000;
const MAX_ERROR_BODY_LENGTH = 1_000;

async function request({
  token,
  origin,
  method,
  path,
  body,
  queryParams,
  responseType = 'json',
  timeout = DEFAULT_TIMEOUT_MS,
}: RequestParams): Promise<unknown> {
  const requestConfig = buildRequest({
    token,
    origin,
    method,
    path,
    body,
    queryParams,
    responseType,
    timeout,
  });
  const { data, error } = await tryCatch(() => httpClient.sendRequest(requestConfig));
  if (error !== null) {
    throw createSafeError({ error, token });
  }
  return data.body;
}

function buildRequest({
  token,
  origin,
  method,
  path,
  body,
  queryParams,
  responseType,
  timeout,
}: RequiredRequestParams): HttpRequest {
  const baseUrl = origin === 'primary'
    ? PRIMARY_BASE_URL
    : origin === 'serp'
      ? SERP_BASE_URL
      : RENDERED_BASE_URL;
  const headers = origin === 'primary'
    ? { Accept: 'application/json', 'Content-Type': 'application/json', 'x-api-token': token }
    : origin === 'serp'
      ? { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      : { Accept: 'application/json', 'Content-Type': 'application/json' };
  return {
    method,
    url: `${baseUrl}${path}`,
    headers,
    body,
    queryParams: origin === 'rendered' ? { token, browserRendering: 'true', ...queryParams } : queryParams,
    responseType,
    timeout,
    retries: 0,
  };
}

function createSafeError({ error, token }: SafeErrorParams): Error {
  const status = error instanceof HttpError ? String(error.response.status) : 'unknown';
  const body = error instanceof HttpError ? error.response.body : error instanceof Error ? error.message : String(error);
  const serialized = safelySerialize(body);
  const redacted = redactToken({ value: serialized, token });
  const truncated = redacted.length > MAX_ERROR_BODY_LENGTH
    ? `${redacted.slice(0, MAX_ERROR_BODY_LENGTH)}…`
    : redacted;
  return new Error(`MrScraper request failed with status ${status}: ${truncated}`);
}

function safelySerialize(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function redactToken({ value, token }: RedactParams): string {
  return value
    .split(token)
    .join('[REDACTED]')
    .split(encodeURIComponent(token))
    .join('[REDACTED]');
}

async function validateToken({ token }: { token: string }): Promise<{ valid: boolean }> {
  const { error } = await tryCatch(() => request({
    token,
    origin: 'primary',
    method: HttpMethod.GET,
    path: '/api/v1/subscription-accounts',
  }));
  return { valid: error === null };
}

export const mrscraperApi = {
  request,
  validateToken,
};

type Origin = 'primary' | 'serp' | 'rendered';

type RequestParams = {
  token: string;
  origin: Origin;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
  responseType?: 'json' | 'text';
  timeout?: number;
};

type RequiredRequestParams = RequestParams & {
  responseType: 'json' | 'text';
  timeout: number;
};

type SafeErrorParams = {
  error: unknown;
  token: string;
};

type RedactParams = {
  value: string;
  token: string;
};
