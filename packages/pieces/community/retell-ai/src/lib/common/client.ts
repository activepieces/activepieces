import { httpClient, HttpMessageBody, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

export const RETELL_BASE_URL = 'https://api.retellai.com';

export class RetellAiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({ message, status, responseBody }: { message: string; status: number; responseBody: unknown }) {
    super(message);
    this.name = 'RetellAiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
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
      return trimmed.slice(0, 500);
    }
  }
  if (!isRecord(parsed)) {
    return undefined;
  }
  const detail = parsed['error_message'] ?? parsed['message'] ?? parsed['error'] ?? parsed['detail'];
  if (typeof detail === 'string') {
    return detail.slice(0, 500);
  }
  if (detail === undefined || detail === null) {
    return undefined;
  }
  return JSON.stringify(detail).slice(0, 500);
}

export function buildRetellError({ status, responseBody }: { status: number; responseBody: unknown }): RetellAiError {
  const base =
    STATUS_MESSAGES[status] ??
    (status >= 500
      ? 'Retell AI returned a server error. Retry later'
      : status >= 300 && status < 400
        ? 'Retell AI answered with an unexpected redirect, which was not followed'
        : 'Retell AI request failed');
  const detail = vendorDetail(responseBody);
  const message = detail === undefined ? `${base} (HTTP ${status}).` : `${base} (HTTP ${status}): ${detail}`;
  return new RetellAiError({ message, status, responseBody });
}

export function buildRetellUrl({ path, query }: { path: string; query?: RetellQuery }): string {
  if (
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('?') ||
    path.includes('#') ||
    path.split('/').some((segment) => segment === '..' || segment === '.')
  ) {
    throw new Error(`Refusing to call Retell AI with an unexpected path: ${path}`);
  }
  const url = new URL(RETELL_BASE_URL + path);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export function apiKeyOf(auth: { props: { apiKey: string } }): string {
  return auth.props.apiKey.trim();
}

export async function retellApiCall<T extends HttpMessageBody = HttpMessageBody>({
  apiKey,
  method,
  path,
  query,
  body,
  retryRateLimit = false,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  contentType,
}: RetellApiCallParams): Promise<T> {
  const request: HttpRequest = {
    method,
    url: buildRetellUrl({ path, query }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      ...(contentType === undefined ? {} : { 'Content-Type': contentType }),
    },
    body,
    followRedirects: false,
    redactBodyInErrors: true,
    timeout: timeoutMs,
  };
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await httpClient.sendRequest<T>(request);
      if (response.status >= 300) {
        throw buildRetellError({ status: response.status, responseBody: response.body });
      }
      return response.body;
    } catch (error) {
      const mapped = toRetellError(error);
      if (mapped === undefined) {
        throw error;
      }
      if (mapped.status === 429 && retryRateLimit && attempt < RATE_LIMIT_BACKOFF_MS.length) {
        await sleep(RATE_LIMIT_BACKOFF_MS[attempt]);
        continue;
      }
      throw mapped;
    }
  }
}

export function toRetellError(error: unknown): RetellAiError | undefined {
  if (error instanceof RetellAiError) {
    return error;
  }
  if (!isRecord(error) && !(error instanceof Error)) {
    return undefined;
  }
  const response: unknown = Reflect.get(error, 'response');
  if (!isRecord(response) || typeof response['status'] !== 'number') {
    return undefined;
  }
  return buildRetellError({ status: response['status'], responseBody: response['body'] });
}

export function isRetellStatus({ error, statuses }: { error: unknown; statuses: number[] }): boolean {
  const mapped = toRetellError(error);
  return mapped !== undefined && statuses.includes(mapped.status);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Retell AI rejected the request as invalid',
  401: 'Retell AI rejected the API key. Check the API key in the Retell AI connection',
  402: 'Retell AI refused the request because the account has no valid payment method or credit',
  403: 'Retell AI denied access. Check the API key permissions',
  404: 'Retell AI could not find the resource. Check the ID',
  409: 'Retell AI reported a conflict with the current state of the resource',
  422: 'Retell AI could not process the request',
  429: 'Retell AI rate or concurrency limit reached. Retry later',
};

const DEFAULT_TIMEOUT_MS = 30000;
const RATE_LIMIT_BACKOFF_MS = [2000, 5000];

export type RetellQuery = Record<string, string | number | boolean | undefined | null>;

export type RetellApiCallParams = {
  apiKey: string;
  method: HttpMethod;
  path: string;
  query?: RetellQuery;
  body?: unknown;
  retryRateLimit?: boolean;
  timeoutMs?: number;
  contentType?: string;
};
