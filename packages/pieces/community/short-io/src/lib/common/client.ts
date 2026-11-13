import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';

const SHORT_IO_API_BASE = 'https://api.short.io';
const SHORT_IO_STATS_BASE = 'https://statistics.short.io/statistics';
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES_ON_429 = 2;
const MAX_RETRY_WAIT_MS = 10_000;
let verifiedTlsAgent: Promise<unknown> | undefined;

export class ShortIoApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseBody: unknown,
  ) {
    super(message);
    this.name = 'ShortIoApiError';
  }
}

function getApiKey(auth: ShortIoAuthValue): string {
  const key = auth?.props?.apiKey?.trim();
  if (!key) {
    throw new Error('The Short.io connection has no API key.');
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

function domainIdSeg(value: unknown): string {
  const text = toText(value);
  if (!/^\d+$/.test(text)) {
    throw new Error(`Domain ID must be a number (got "${text}").`);
  }
  return text;
}

function vendorMessage({ responseBody, fallback }: { responseBody: unknown; fallback: string }): string {
  if (responseBody !== null && typeof responseBody === 'object') {
    const message = Reflect.get(responseBody, 'message');
    const error = Reflect.get(responseBody, 'error');
    const field = Reflect.get(responseBody, 'field');
    const text = typeof message === 'string' && message ? message : typeof error === 'string' && error ? error : '';
    if (text) {
      return typeof field === 'string' && field ? `${text} (field: ${field})` : text;
    }
  }
  if (typeof responseBody === 'string' && responseBody.trim()) {
    return responseBody.trim().slice(0, 500);
  }
  return fallback;
}

function buildQuery(query?: Record<string, QueryValue>): QueryParams {
  return Object.fromEntries(
    Object.entries(query ?? {})
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, String(value)]),
  );
}

function retryDelayMs({ header, attempt }: { header: string | null; attempt: number }): number {
  const seconds = header ? Number(header) : NaN;
  const wait = Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : 1000 * 2 ** attempt;
  return Math.min(wait, MAX_RETRY_WAIT_MS);
}

function verifiedTls(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
  return verifiedTlsAgent;
}

function carriesSecret(body: unknown): boolean {
  return body !== null && typeof body === 'object' && !Array.isArray(body) && Reflect.get(body, 'password') !== undefined;
}

function headerValue({ headers, name }: { headers: unknown; name: string }): string | null {
  if (headers === null || typeof headers !== 'object') {
    return null;
  }
  const value = Reflect.get(headers, name);
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : null;
  }
  return typeof value === 'string' ? value : null;
}

function toApiError({ status, responseBody }: { status: number; responseBody: unknown }): ShortIoApiError {
  const fallback = status >= 300 && status < 400 ? 'unexpected redirect' : 'request failed';
  return new ShortIoApiError(`Short.io API error (${status}): ${vendorMessage({ responseBody, fallback })}`, status, responseBody);
}

function failureOf(error: unknown): RawResponse | null {
  if (error === null || typeof error !== 'object') {
    return null;
  }
  const response = Reflect.get(error, 'response');
  if (response === null || typeof response !== 'object') {
    return null;
  }
  const status = Reflect.get(response, 'status');
  return typeof status === 'number' ? { status, body: Reflect.get(response, 'body'), headers: {} } : null;
}

async function viaHttpClient({ request, url, binary }: { request: ShortIoRequest; url: string; binary: boolean }): Promise<RawResponse> {
  const dispatcher = await verifiedTls();
  const hasBody = request.body !== undefined && request.method !== HttpMethod.GET;
  try {
    const response = await httpClient.sendRequest(
      {
        method: request.method,
        url,
        headers: {
          authorization: getApiKey(request.auth),
          accept: binary ? '*/*' : 'application/json',
          ...(hasBody ? { 'content-type': 'application/json' } : {}),
        },
        queryParams: buildQuery(request.query),
        body: hasBody ? request.body : undefined,
        timeout: REQUEST_TIMEOUT_MS,
        followRedirects: false,
        responseType: binary ? 'arraybuffer' : 'json',
        redactBodyInErrors: hasBody && carriesSecret(request.body),
      },
      { dispatcher },
    );
    return { status: response.status, body: response.body, headers: response.headers };
  } catch (error) {
    const failure = failureOf(error);
    if (failure) {
      return failure;
    }
    throw error;
  }
}

async function send({ request, binary }: { request: ShortIoRequest; binary: boolean }): Promise<RawResponse> {
  const url = (request.base === 'stats' ? SHORT_IO_STATS_BASE : SHORT_IO_API_BASE) + request.path;
  for (let attempt = 0; ; attempt++) {
    const response = await viaHttpClient({ request, url, binary });
    if (response.status === 429 && attempt < MAX_RETRIES_ON_429) {
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs({ header: headerValue({ headers: response.headers, name: 'retry-after' }), attempt })));
      continue;
    }
    if (response.status < 200 || response.status >= 300) {
      throw toApiError({ status: response.status, responseBody: response.body });
    }
    return response;
  }
}

async function request(req: ShortIoRequest): Promise<unknown> {
  const response = await send({ request: req, binary: false });
  return response.body;
}

async function binaryRequest(req: ShortIoRequest): Promise<{ data: Buffer; contentType: string }> {
  const response = await send({ request: req, binary: true });
  const data = Buffer.isBuffer(response.body) ? response.body : Buffer.from(typeof response.body === 'string' ? response.body : '');
  return { data, contentType: headerValue({ headers: response.headers, name: 'content-type' }) ?? '' };
}

function errorStatus(error: unknown): number | undefined {
  return error instanceof ShortIoApiError ? error.status : undefined;
}

function rethrowWithHint({ error, hints }: { error: unknown; hints: Partial<Record<number, string>> }): never {
  if (error instanceof ShortIoApiError) {
    const defaults: Record<number, string> = {
      401: 'Authentication failed. Check the API key on the Short.io connection.',
      402: 'This feature needs a paid Short.io plan.',
      403: 'Access denied. The API key cannot access this domain or link.',
      429: 'Short.io rate limit reached. Try again in a moment.',
    };
    const hint = hints[error.status] ?? defaults[error.status];
    if (hint) {
      throw new ShortIoApiError(
        `${hint} Short.io said: ${vendorMessage({ responseBody: error.responseBody, fallback: error.message })}`,
        error.status,
        error.responseBody,
      );
    }
  }
  throw error;
}

export const shortIoClient = {
  request,
  binaryRequest,
  seg,
  domainIdSeg,
  vendorMessage,
  errorStatus,
  rethrowWithHint,
  getApiKey,
};

type RawResponse = { status: number; body: unknown; headers: unknown };

export type ShortIoAuthValue = { props: { apiKey: string } };

export type QueryValue = string | number | boolean | undefined | null;

export type ShortIoRequest = {
  auth: ShortIoAuthValue;
  method: HttpMethod;
  path: string;
  base?: 'api' | 'stats';
  query?: Record<string, QueryValue>;
  body?: unknown;
};
