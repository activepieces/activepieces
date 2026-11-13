import {
  httpClient,
  HttpMessageBody,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.lemlist.com/api';

export class LemlistApiError extends Error {
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
    this.name = 'LemlistApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isLemlistStatus({
  error,
  status,
}: {
  error: unknown;
  status: number;
}): boolean {
  return error instanceof LemlistApiError && error.status === status;
}

function readHttpErrorResponse(
  error: unknown
): { status: number; body: unknown } | undefined {
  if (!isRecord(error) && !(error instanceof Error)) {
    return undefined;
  }
  const response: unknown = Reflect.get(error, 'response');
  if (!isRecord(response)) {
    return undefined;
  }
  const status = response['status'];
  if (typeof status !== 'number') {
    return undefined;
  }
  return { status, body: response['body'] };
}

export function vendorDetail(responseBody: unknown): string | undefined {
  let parsed = responseBody;
  if (typeof parsed === 'string') {
    const trimmed = parsed.trim();
    if (trimmed.length === 0) {
      return undefined;
    }
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return trimmed.slice(0, 300);
    }
  }
  if (!isRecord(parsed)) {
    return undefined;
  }
  const nested = isRecord(parsed['error']) ? parsed['error']['message'] : undefined;
  const detail = nested ?? parsed['message'] ?? parsed['error'];
  return typeof detail === 'string' ? detail.slice(0, 300) : undefined;
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'lemlist rejected the request as invalid',
  401: 'lemlist rejected the API key. Check the API key in the lemlist connection',
  402: 'lemlist refused the request because the plan or credits do not allow it',
  403: 'lemlist refused the request: the plan or API key has no access to this resource',
  404: 'lemlist could not find the resource. Check the ID or email',
  405: 'lemlist does not allow this operation on the resource',
  409: 'lemlist reported a conflict with the current state of the resource',
  429: 'lemlist rate limit reached (20 requests per 2 seconds). Retry later',
};

export function buildLemlistError({
  status,
  responseBody,
}: {
  status: number;
  responseBody: unknown;
}): LemlistApiError {
  const base =
    STATUS_MESSAGES[status] ??
    (status >= 500
      ? 'lemlist returned a server error. Retry later'
      : status >= 300 && status < 400
        ? 'lemlist answered with an unexpected redirect, which was not followed'
        : 'lemlist request failed');
  const detail = vendorDetail(responseBody);
  const message =
    detail === undefined
      ? `${base} (HTTP ${status}).`
      : status === 403
        ? `lemlist refused the request (HTTP 403): ${detail}`
        : `${base} (HTTP ${status}): ${detail}`;
  return new LemlistApiError({ message, status, responseBody });
}

export function buildLemlistUrl({
  resourceUri,
  query,
}: {
  resourceUri: string;
  query?: LemlistQuery;
}): string {
  if (
    !resourceUri.startsWith('/') ||
    resourceUri.startsWith('//') ||
    resourceUri.includes('?') ||
    resourceUri.includes('#') ||
    resourceUri.split('/').some((segment) => segment === '..' || segment === '.')
  ) {
    throw new Error(`Refusing to call lemlist with an unexpected path: ${resourceUri}`);
  }
  const url = new URL(BASE_URL + resourceUri);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export function basicAuthHeader(apiKey: string): string {
  return `Basic ${Buffer.from(`:${apiKey.trim()}`).toString('base64')}`;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendOnce<T extends HttpMessageBody>({
  apiKey,
  method,
  resourceUri,
  query,
  body,
}: LemlistApiCallParams): Promise<{ status: number; body: T }> {
  const request: HttpRequest = {
    method,
    url: buildLemlistUrl({ resourceUri, query }),
    headers: {
      Authorization: basicAuthHeader(apiKey),
      Accept: 'application/json',
    },
    body,
    followRedirects: false,
    redactBodyInErrors: true,
    timeout: TIMEOUT_MS,
  };
  try {
    const response = await httpClient.sendRequest<T>(request);
    if (response.status >= 300) {
      throw buildLemlistError({ status: response.status, responseBody: response.body });
    }
    return { status: response.status, body: response.body };
  } catch (error) {
    if (error instanceof LemlistApiError) {
      throw error;
    }
    const httpError = readHttpErrorResponse(error);
    if (httpError === undefined) {
      throw error;
    }
    throw buildLemlistError({ status: httpError.status, responseBody: httpError.body });
  }
}

export async function lemlistApiRequest<T extends HttpMessageBody>(
  params: LemlistApiCallParams
): Promise<{ status: number; body: T }> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await sendOnce<T>(params);
    } catch (error) {
      if (isLemlistStatus({ error, status: 429 }) && attempt < MAX_RATE_LIMIT_RETRIES) {
        await sleep(RATE_LIMIT_WAIT_MS * (attempt + 1));
        continue;
      }
      throw error;
    }
  }
}

export async function lemlistApiCall<T extends HttpMessageBody>(
  params: LemlistApiCallParams
): Promise<T> {
  const response = await lemlistApiRequest<T>(params);
  return response.body;
}

const TIMEOUT_MS = 30_000;
const MAX_RATE_LIMIT_RETRIES = 2;
const RATE_LIMIT_WAIT_MS = 2_000;

export type LemlistQuery = Record<string, string | number | boolean | undefined | null>;

export type LemlistApiCallParams = {
  apiKey: string;
  method: HttpMethod;
  resourceUri: string;
  query?: LemlistQuery;
  body?: unknown;
};
