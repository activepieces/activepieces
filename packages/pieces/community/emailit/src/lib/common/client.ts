import { httpClient, HttpMethod, HttpResponse, QueryParams } from '@activepieces/pieces-common';

export const EMAILIT_API_BASE = 'https://api.emailit.com/v2';
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES_ON_429 = 2;
const MAX_RETRY_WAIT_MS = 10_000;
let verifiedTlsAgent: Promise<unknown> | undefined;

export class EmailitApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseBody: unknown,
  ) {
    super(message);
    this.name = 'EmailitApiError';
  }
}

function apiKeyOf(auth: EmailitAuthInput): string {
  const raw = typeof auth === 'string' ? auth : auth?.secret_text;
  const key = typeof raw === 'string' ? raw.trim() : '';
  if (!key) {
    throw new Error('The Emailit connection has no API key.');
  }
  return key;
}

function toText(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return typeof value === 'string' ? value.trim() : '';
}

function seg({ value, label }: { value: unknown; label: string }): string {
  const text = toText(value);
  if (text === '' || text === '.' || text === '..') {
    throw new Error(`${label} is required.`);
  }
  return encodeURIComponent(text);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function stringField({ record, key }: { record: Record<string, unknown>; key: string }): string {
  const value = record[key];
  return typeof value === 'string' ? value.trim() : '';
}

function validationDetails(body: Record<string, unknown>): string {
  const list = body['validation_errors'] ?? body['details'] ?? body['errors'];
  if (Array.isArray(list)) {
    return list
      .slice(0, 10)
      .map((item) => {
        if (typeof item === 'string') return item;
        if (isRecord(item)) {
          const where = stringField({ record: item, key: 'instancePath' }) || stringField({ record: item, key: 'field' });
          const what = stringField({ record: item, key: 'message' });
          return where ? `${where}: ${what}` : what;
        }
        return '';
      })
      .filter((text) => text !== '')
      .join('; ');
  }
  if (isRecord(list)) {
    return Object.entries(list)
      .slice(0, 10)
      .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(', ') : String(value)}`)
      .join('; ');
  }
  return '';
}

function vendorMessage(responseBody: unknown): string {
  if (isRecord(responseBody)) {
    const error = responseBody['error'];
    const nested = isRecord(error) ? stringField({ record: error, key: 'message' }) : '';
    const message = stringField({ record: responseBody, key: 'message' }) || nested;
    const errorText = typeof error === 'string' ? error.trim() : '';
    const head = message && errorText && !message.includes(errorText) ? `${errorText}: ${message}` : message || errorText;
    const details = validationDetails(responseBody);
    const text = details ? `${head || 'Validation failed'} (${details})` : head;
    if (text) {
      return text;
    }
  }
  if (typeof responseBody === 'string' && responseBody.trim()) {
    return responseBody.trim().slice(0, 300);
  }
  return 'request failed';
}

function hintFor({ status, responseBody }: { status: number; responseBody: unknown }): string {
  const code = isRecord(responseBody) ? stringField({ record: responseBody, key: 'code' }) || stringField({ record: responseBody, key: 'error' }) : '';
  const message = vendorMessage(responseBody).toLowerCase();
  if (status === 401) return ' Check the API key in the Emailit connection.';
  if (status === 402) return ' The Emailit workspace is out of credits.';
  if (status === 403 && (code === 'unverified_workspace_recipient' || message.includes('workspace not verified'))) {
    return ' The workspace is in sandbox mode: it can only send to its members\' account emails until Emailit grants production access.';
  }
  if (status === 403 && code === 'plan_required') return ' This feature needs a higher Emailit plan.';
  if (status === 403 && message.includes('permission denied')) {
    return ' This API key is Sending Only. Use a Full Access key for this action.';
  }
  if (status === 429) return ' Emailit rate limit reached; try again later.';
  return '';
}

function toApiError({ status, responseBody }: { status: number; responseBody: unknown }): EmailitApiError {
  const base = status >= 300 && status < 400 ? 'unexpected redirect' : vendorMessage(responseBody);
  return new EmailitApiError(`Emailit API error (${status}): ${base}.${hintFor({ status, responseBody })}`.replace('..', '.'), status, responseBody);
}

function buildQuery(query?: Record<string, QueryValue>): QueryParams {
  return Object.fromEntries(
    Object.entries(query ?? {})
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, String(value)]),
  );
}

function headerValue({ headers, name }: { headers: unknown; name: string }): string | null {
  if (!isRecord(headers)) return null;
  const value = headers[name];
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : null;
  return typeof value === 'string' ? value : null;
}

function retryDelayMs({ response, attempt }: { response: RawResponse; attempt: number }): number | null {
  const header = headerValue({ headers: response.headers, name: 'retry-after' });
  const bodyValue = isRecord(response.body) ? response.body['retry_after'] : undefined;
  const raw = header ?? (typeof bodyValue === 'number' || typeof bodyValue === 'string' ? String(bodyValue) : '');
  const seconds = /^\d+(\.\d+)?$/.test(raw.trim()) ? Number(raw.trim()) : NaN;
  const wait = Number.isFinite(seconds) ? seconds * 1000 : 1000 * 2 ** attempt;
  return wait > MAX_RETRY_WAIT_MS ? null : wait;
}

function verifiedTls(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
  return verifiedTlsAgent;
}

function failureOf(error: unknown): RawResponse | null {
  if (error === null || typeof error !== 'object') return null;
  const response = Reflect.get(error, 'response');
  if (!isRecord(response)) return null;
  const status = response['status'];
  return typeof status === 'number' ? { status, body: response['body'], headers: isRecord(response['headers']) ? response['headers'] : {} } : null;
}

async function sendOnce(request: EmailitRequest): Promise<RawResponse> {
  const dispatcher = await verifiedTls();
  const hasBody = request.body !== undefined && request.method !== HttpMethod.GET && request.method !== HttpMethod.DELETE;
  const headers: Record<string, string> = {
    authorization: `Bearer ${apiKeyOf(request.auth)}`,
    accept: 'application/json',
  };
  if (hasBody) headers['content-type'] = 'application/json';
  if (request.idempotencyKey) headers['idempotency-key'] = request.idempotencyKey;
  try {
    const response: HttpResponse = await httpClient.sendRequest(
      {
        method: request.method,
        url: `${EMAILIT_API_BASE}${request.path}`,
        headers,
        queryParams: buildQuery(request.query),
        body: hasBody ? request.body : undefined,
        timeout: REQUEST_TIMEOUT_MS,
        followRedirects: false,
        redactBodyInErrors: request.redactBody === true,
      },
      { dispatcher },
    );
    return { status: response.status, body: response.body, headers: isRecord(response.headers) ? response.headers : {} };
  } catch (error) {
    const failure = failureOf(error);
    if (failure) return failure;
    throw error;
  }
}

async function send(request: EmailitRequest): Promise<RawResponse> {
  const retryable = request.method === HttpMethod.GET || request.idempotencyKey !== undefined || request.safeToRetry === true;
  for (let attempt = 0; ; attempt++) {
    const response = await sendOnce(request);
    const delay = response.status === 429 && retryable && attempt < MAX_RETRIES_ON_429
      ? retryDelayMs({ response, attempt })
      : null;
    if (delay !== null) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    if (response.status < 200 || response.status >= 300) {
      throw toApiError({ status: response.status, responseBody: response.body });
    }
    return response;
  }
}

async function request(req: EmailitRequest): Promise<unknown> {
  const response = await send(req);
  return response.body;
}

function statusOf(error: unknown): number | undefined {
  return error instanceof EmailitApiError ? error.status : undefined;
}

function rethrowWithHint({ error, hints }: { error: unknown; hints: Partial<Record<number, string>> }): never {
  const status = statusOf(error);
  const hint = status !== undefined ? hints[status] : undefined;
  if (hint && error instanceof EmailitApiError && !error.message.toLowerCase().includes(hint.replace(/\.$/, '').toLowerCase())) {
    throw new EmailitApiError(`${hint} ${error.message}`, error.status, error.responseBody);
  }
  throw error;
}

function clampLimit(value: unknown): number {
  const fallback = 25;
  const parsed = typeof value === 'string' ? Number(value) : value;
  if (parsed === undefined || parsed === null || parsed === '') return fallback;
  if (typeof parsed !== 'number' || !Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
    throw new Error('Limit must be a whole number from 1 to 100.');
  }
  return parsed;
}

function page(value: unknown): number {
  const parsed = typeof value === 'string' ? Number(value) : value;
  if (parsed === undefined || parsed === null || parsed === '') return 1;
  if (typeof parsed !== 'number' || !Number.isInteger(parsed) || parsed < 1) {
    throw new Error('Page must be a whole number of 1 or more.');
  }
  return parsed;
}

function listPage(body: unknown): { items: unknown[]; hasMore: boolean; totalRecords: number | null } {
  const record = isRecord(body) ? body : {};
  const items = Array.isArray(record['data']) ? record['data'] : [];
  const next = record['next_page_url'];
  const currentPage = record['current_page'];
  const totalPages = record['total_pages'];
  const hasMore =
    typeof next === 'string' && next !== ''
      ? true
      : typeof currentPage === 'number' && typeof totalPages === 'number'
        ? currentPage < totalPages
        : false;
  const total = record['total_records'];
  return { items, hasMore, totalRecords: typeof total === 'number' ? total : null };
}

export const emailitClient = { request, send, seg, isRecord, rethrowWithHint, statusOf, clampLimit, page, listPage, apiKeyOf, toApiError };

type QueryValue = string | number | boolean | undefined | null;
export type EmailitAuthInput = string | { secret_text: string } | undefined;
type RawResponse = { status: number; body: unknown; headers: Record<string, unknown> };
export type EmailitRequest = {
  auth: EmailitAuthInput;
  method: HttpMethod;
  path: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
  idempotencyKey?: string;
  redactBody?: boolean;
  safeToRetry?: boolean;
};
