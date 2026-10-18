import { httpClient, HttpMessageBody, HttpMethod } from '@activepieces/pieces-common';

const FOREPLAY_API_URL = 'https://public.api.foreplay.co';
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_RATE_LIMIT_RETRIES = 2;
const MAX_RATE_LIMIT_WAIT_MS = 30_000;
const RATE_LIMIT_BASE_WAIT_MS = 2_000;

class ForeplayApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseBody: unknown,
  ) {
    super(message);
    this.name = 'ForeplayApiError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function keyOf(auth: ForeplayAuthInput): string {
  const raw = typeof auth === 'string' ? auth : isRecord(auth) ? auth['secret_text'] : undefined;
  const key = typeof raw === 'string' ? raw.trim() : '';
  if (key === '') throw new Error('The Foreplay connection has no API key. Reconnect Foreplay with a key from https://app.foreplay.co/api-overview.');
  return key;
}

function hintFor(status: number): string {
  if (status === 401) return ' The API key is invalid or revoked; reconnect Foreplay.';
  if (status === 402) return ' Your Foreplay account is out of API credits.';
  if (status === 403) return ' Your Foreplay plan does not include this, or the page/brand is not in your Spyder watchlist.';
  if (status === 404) return ' Check the ID you passed.';
  if (status === 429) return ' Foreplay is rate limiting this API key; try again later.';
  return '';
}

function messageOf(body: unknown): string | undefined {
  if (typeof body === 'string') return body.trim() === '' ? undefined : body.trim().slice(0, 300);
  if (!isRecord(body)) return undefined;
  const parts: string[] = [];
  const err = body['error'];
  if (typeof err === 'string' && err.trim() !== '') parts.push(err.trim());
  else if (isRecord(err) && typeof err['message'] === 'string' && err['message'].trim() !== '') parts.push(err['message'].trim());
  const detail = body['detail'];
  if (typeof detail === 'string' && detail.trim() !== '') parts.push(detail.trim());
  else if (Array.isArray(detail)) {
    const lines = detail.map((d) => {
      if (!isRecord(d)) return String(d);
      const loc = Array.isArray(d['loc']) ? d['loc'].filter((l) => l !== 'query' && l !== 'path').join('.') : '';
      return `${loc ? `${loc}: ` : ''}${typeof d['msg'] === 'string' ? d['msg'] : JSON.stringify(d)}`;
    });
    if (lines.length > 0) parts.push(lines.join('; '));
  }
  const metadata = body['metadata'];
  if (parts.length === 0 && isRecord(metadata) && typeof metadata['message'] === 'string') parts.push(metadata['message']);
  if (parts.length === 0 && Object.keys(body).length > 0) parts.push(JSON.stringify(body).slice(0, 300));
  return parts.length > 0 ? parts.join(' — ') : undefined;
}

function toApiError({ status, body }: { status: number; body: unknown }): ForeplayApiError {
  const text = status >= 300 && status < 400 ? 'unexpected redirect' : messageOf(body) ?? 'request failed';
  return new ForeplayApiError(`Foreplay API error (${status}): ${text.replace(/\.+$/, '')}.${hintFor(status)}`, status, body);
}

function failureOf(error: unknown): { status: number; body: unknown } | null {
  if (error === null || typeof error !== 'object') return null;
  const response = Reflect.get(error, 'response');
  if (!isRecord(response)) return null;
  const status = response['status'];
  return typeof status === 'number' ? { status, body: response['body'] } : null;
}

function headerOf({ headers, name }: { headers: unknown; name: string }): string | undefined {
  if (!isRecord(headers)) return undefined;
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== name) continue;
    const v = Array.isArray(value) ? value[0] : value;
    if (typeof v === 'string' || typeof v === 'number') return String(v);
  }
  return undefined;
}

function rateLimitWaitMs(attempt: number): number {
  return Math.min(RATE_LIMIT_BASE_WAIT_MS * 2 ** attempt, MAX_RATE_LIMIT_WAIT_MS);
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function normalizePath(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(path)) {
    throw new Error('Foreplay request paths must be relative to the Foreplay API (start with a single "/").');
  }
  if (path.split(/[/?#]/).some((part) => part === '..' || part.toLowerCase() === '%2e%2e')) {
    throw new Error('Foreplay request paths must not contain ".." segments.');
  }
  return path;
}

function queryString(query?: ForeplayQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else {
      params.append(key, String(value));
    }
  }
  const text = params.toString();
  return text === '' ? '' : `?${text}`;
}

function numberOrNull(value: string | undefined): number | null {
  if (value === undefined || value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function request({ auth, path, query }: ForeplayRequest): Promise<ForeplayResponse> {
  const apiKey = keyOf(auth);
  const url = `${FOREPLAY_API_URL}${normalizePath(path)}${queryString(query)}`;
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await httpClient.sendRequest<HttpMessageBody>({
        method: HttpMethod.GET,
        url,
        headers: { Authorization: apiKey, accept: 'application/json' },
        timeout: REQUEST_TIMEOUT_MS,
        followRedirects: false,
      });
      if (response.status < 200 || response.status >= 300) throw toApiError({ status: response.status, body: response.body });
      const body: unknown = response.body;
      if (isRecord(body) && isRecord(body['metadata']) && body['metadata']['success'] === false) {
        const status = typeof body['metadata']['status_code'] === 'number' ? body['metadata']['status_code'] : response.status;
        throw toApiError({ status, body });
      }
      return {
        body,
        creditCost: numberOrNull(headerOf({ headers: response.headers, name: 'x-credit-cost' })),
        creditsRemaining: numberOrNull(headerOf({ headers: response.headers, name: 'x-credits-remaining' })),
      };
    } catch (error) {
      if (error instanceof ForeplayApiError) throw error;
      const failure = failureOf(error);
      if (!failure) throw error;
      if (failure.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
        await sleep(rateLimitWaitMs(attempt));
        continue;
      }
      throw toApiError(failure);
    }
  }
}

function pathId(id: string): string {
  return encodeURIComponent(id);
}

const foreplayClient = {
  request,
  keyOf,
  isRecord,
  normalizePath,
  pathId,
  FOREPLAY_API_URL,
};

type ForeplayAuthInput = string | { secret_text: string };

type ForeplayQuery = Record<string, string | number | boolean | string[] | null | undefined>;

type ForeplayRequest = {
  auth: ForeplayAuthInput;
  path: string;
  query?: ForeplayQuery;
};

type ForeplayResponse = {
  body: unknown;
  creditCost: number | null;
  creditsRemaining: number | null;
};

export { foreplayClient, ForeplayApiError, FOREPLAY_API_URL };
export type { ForeplayAuthInput, ForeplayQuery, ForeplayResponse };
