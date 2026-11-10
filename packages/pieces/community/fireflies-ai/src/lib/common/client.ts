import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { BASE_URL } from './index';

function isRecord(value: unknown): value is FirefliesRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function recordList(value: unknown): FirefliesRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function apiKeyOf(auth: unknown): string {
  const raw = typeof auth === 'string' ? auth : isRecord(auth) ? auth['secret_text'] : undefined;
  return typeof raw === 'string' ? raw.trim() : '';
}

function verifiedTlsDispatcher(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
  return verifiedTlsAgent;
}

function firstError(responseBody: unknown): FirefliesRecord | undefined {
  if (!isRecord(responseBody)) {
    return undefined;
  }
  return recordList(responseBody['errors'])[0];
}

function textOf(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim() !== '') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

function describeFailure({ operation, status, responseBody, retryAfterHeader }: { operation: string; status: number; responseBody: unknown; retryAfterHeader: string | null }): FirefliesFailure {
  const error = firstError(responseBody);
  const extensions = error && isRecord(error['extensions']) ? error['extensions'] : undefined;
  const metadata = extensions && isRecord(extensions['metadata']) ? extensions['metadata'] : undefined;
  const code = textOf(error?.['code']) ?? textOf(extensions?.['code']);
  const vendorStatus = textOf(extensions?.['status']);
  const retryAfter = textOf(metadata?.['retryAfter']) ?? textOf(retryAfterHeader);
  const vendorText = textOf(error?.['message']) ?? (typeof responseBody === 'string' ? textOf(responseBody) : undefined) ?? 'no error details returned';
  const parts = [`HTTP ${status}`];
  if (code) {
    parts.push(`code ${code}`);
  }
  if (vendorStatus && vendorStatus !== String(status)) {
    parts.push(`vendor status ${vendorStatus}`);
  }
  const fieldText = fieldMessages(metadata);
  const detail = fieldText ? `${vendorText}: ${fieldText}` : vendorText;
  let message = `Fireflies ${operation} failed (${parts.join(', ')}): Fireflies said "${detail.slice(0, MAX_ERROR_TEXT)}".`;
  if (code === 'too_many_requests' || status === 429) {
    message += retryAfter ? ` Retry after ${retryAfter}.` : ' Wait before retrying.';
  }
  return { message, code, retryAfter };
}

function fieldMessages(metadata: FirefliesRecord | undefined): string | undefined {
  const messages = recordList(metadata?.['fields']).flatMap((field) => {
    const text = textOf(field['message']);
    return text ? [text] : [];
  });
  return messages.length > 0 ? [...new Set(messages)].join(' ') : undefined;
}

function httpErrorResponse(error: unknown): { status: number; body: unknown } | undefined {
  if (!(error instanceof Error)) {
    return undefined;
  }
  const response: unknown = Reflect.get(error, 'response');
  if (!isRecord(response) || typeof response['status'] !== 'number') {
    return undefined;
  }
  return { status: response['status'], body: response['body'] };
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
}

function headerValue({ headers, name }: { headers: unknown; name: string }): string | null {
  if (!isRecord(headers)) {
    return null;
  }
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === name);
  if (!entry) {
    return null;
  }
  const value = entry[1];
  if (typeof value === 'string') {
    return value;
  }
  return Array.isArray(value) && typeof value[0] === 'string' ? value[0] : null;
}

function trimBody(body: unknown): unknown {
  return typeof body === 'string' ? body.slice(0, MAX_ERROR_TEXT) : body;
}

async function graphql({ apiKey, query, variables, operation, timeoutMs = REQUEST_TIMEOUT_MS }: GraphqlRequest): Promise<FirefliesRecord> {
  const token = apiKeyOf(apiKey);
  if (token === '') {
    throw new Error('The Fireflies API key is empty. Reconnect the Fireflies connection with a key from Integrations > Fireflies API.');
  }
  const effectiveTimeout = Math.max(1, Math.min(timeoutMs, REQUEST_TIMEOUT_MS));
  const request: HttpRequest = {
    method: HttpMethod.POST,
    url: BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: { query, variables: variables ?? {} },
    timeout: effectiveTimeout,
    followRedirects: false,
    redactBodyInErrors: true,
  };
  const dispatcher = await verifiedTlsDispatcher();
  let status: number;
  let responseBody: unknown;
  let retryAfterHeader: string | null = null;
  try {
    const response = await httpClient.sendRequest<unknown>(request, { dispatcher });
    status = response.status;
    responseBody = trimBody(response.body);
    retryAfterHeader = headerValue({ headers: response.headers, name: 'retry-after' });
  } catch (error) {
    const failed = httpErrorResponse(error);
    if (failed === undefined) {
      if (isAbort(error)) {
        throw new Error(`Fireflies ${operation} timed out after ${Math.round(effectiveTimeout / 1000)} s with no response.`);
      }
      throw new Error(`Fireflies ${operation} could not reach the Fireflies API: ${error instanceof Error ? error.message : 'network error'}.`);
    }
    status = failed.status;
    responseBody = trimBody(failed.body);
  }
  if (status >= 300 && status < 400) {
    throw new FirefliesApiError({ message: `Fireflies ${operation} failed (HTTP ${status}): the API answered with a redirect, which is not followed.`, status, code: undefined, retryAfter: undefined, responseBody: undefined });
  }
  const hasErrors = isRecord(responseBody) && recordList(responseBody['errors']).length > 0;
  if (status < 200 || status >= 300 || hasErrors) {
    const failure = describeFailure({ operation, status, responseBody, retryAfterHeader });
    throw new FirefliesApiError({ message: failure.message, status, code: failure.code, retryAfter: failure.retryAfter, responseBody });
  }
  if (!isRecord(responseBody) || !isRecord(responseBody['data'])) {
    throw new FirefliesApiError({ message: `Fireflies ${operation} failed (HTTP ${status}): the response had no data object.`, status, code: undefined, retryAfter: undefined, responseBody });
  }
  return responseBody['data'];
}

function requireEntity({ data, key, notFound }: { data: FirefliesRecord; key: string; notFound: string }): FirefliesRecord {
  const value = data[key];
  if (!isRecord(value)) {
    throw new Error(notFound);
  }
  return value;
}

export const firefliesClient = { graphql, requireEntity, isRecord, recordList, apiKeyOf, verifiedTlsDispatcher };

let verifiedTlsAgent: Promise<unknown> | undefined;

const REQUEST_TIMEOUT_MS = 60_000;

const MAX_ERROR_TEXT = 500;

export class FirefliesApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly retryAfter: string | undefined;
  readonly responseBody: unknown;

  constructor({ message, status, code, retryAfter, responseBody }: { message: string; status: number; code: string | undefined; retryAfter: string | undefined; responseBody: unknown }) {
    super(message);
    this.name = 'FirefliesApiError';
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
    this.responseBody = responseBody;
  }
}

export type FirefliesRecord = Record<string, unknown>;

export type GraphqlRequest = {
  apiKey: unknown;
  query: string;
  variables?: Record<string, unknown>;
  operation: string;
  timeoutMs?: number;
};

type FirefliesFailure = { message: string; code: string | undefined; retryAfter: string | undefined };
