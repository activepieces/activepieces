import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { SentEnvelope } from './types';
import { sentValues } from './values';

async function request<T>({
  apiKey,
  path,
  method = HttpMethod.GET,
  profileId,
  idempotencyKey,
  query,
  body,
}: RequestOptions): Promise<SentEnvelope<T>> {
  try {
    const response = await httpClient.sendRequest<SentEnvelope<T>>({
      method,
      url: `${SENT_API_URL}${path}`,
      headers: {
        'x-api-key': apiKey,
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(profileId ? { 'x-profile-id': profileId } : {}),
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      queryParams: Object.fromEntries(
        Object.entries(query ?? {})
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([k, v]) => [k, String(v)])
      ),
      body,
      retries: 0,
      followRedirects: false,
      timeout: 30000,
    });
    if (response.status === 204 && method === HttpMethod.DELETE)
      return { success: true };
    if (
      response.status < 200 ||
      response.status >= 300 ||
      response.body?.success === false
    ) {
      throw apiError({ status: response.status, body: response.body, apiKey });
    }
    if (!response.body || response.body.success !== true) {
      throw new SentApiError({
        status: response.status,
        message: 'Sent returned an unexpected response envelope.',
      });
    }
    return response.body;
  } catch (error) {
    if (error instanceof SentApiError) throw error;
    if (error instanceof HttpError)
      throw apiError({ ...error.response, apiKey });
    throw new SentApiError({
      status: 0,
      message:
        'Could not reach Sent. Check connectivity. A timed-out send may have been accepted; retry with the same idempotency key.',
    });
  }
}

function apiError({
  status,
  body,
  apiKey,
}: {
  status: number;
  body: unknown;
  apiKey: string;
}): SentApiError {
  const envelope = sentValues.isRecord(body) ? body : {};
  const error = sentValues.isRecord(envelope['error']) ? envelope['error'] : {};
  const meta = sentValues.isRecord(envelope['meta']) ? envelope['meta'] : {};
  const messages: Record<number, string> = {
    401: 'Invalid or expired API key. Reconnect with a valid Sent API key.',
    403: 'Permission denied. Check API key permissions and Sender Profile access.',
    400: 'Sent rejected the request. Check the input fields.',
    404: 'The requested Sent resource was not found.',
    429: 'Sent rate limit reached. Wait before retrying.',
  };
  const code = sentValues.optionalString(error['code']);
  const requestId = sentValues.optionalString(meta['request_id']);
  const detail = sentValues.optionalString(error['message']);
  const message = [
    messages[status] ?? 'Sent API request failed.',
    detail,
    code && `Code: ${code}.`,
    requestId && `Request ID: ${requestId}.`,
    `HTTP ${status}.`,
  ]
    .filter(Boolean)
    .join(' ');
  return new SentApiError({
    status,
    message: redact({ value: message, apiKey }),
    code: code && redact({ value: code, apiKey }),
    requestId: requestId && redact({ value: requestId, apiKey }),
  });
}

function redact({ value, apiKey }: { value: string; apiKey: string }): string {
  return apiKey
    ? value
        .split(apiKey)
        .join('[redacted]')
        .split(encodeURIComponent(apiKey))
        .join('[redacted]')
    : value;
}

function data<T>(envelope: SentEnvelope<T>): T {
  if (envelope.data === undefined || envelope.data === null)
    throw new Error('Sent returned no resource data.');
  return envelope.data;
}

export class SentApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly requestId?: string;
  constructor({
    status,
    message,
    code,
    requestId,
  }: {
    status: number;
    message: string;
    code?: string;
    requestId?: string;
  }) {
    super(message);
    this.name = 'SentApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export const sentApi = { request, data };
export const SENT_API_URL = 'https://api.sent.dm/v3';
export type RequestOptions = {
  apiKey: string;
  path: string;
  method?: HttpMethod;
  profileId?: string;
  idempotencyKey?: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};
