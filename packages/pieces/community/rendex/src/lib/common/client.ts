import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { RENDEX_BASE_URL, RENDEX_LIMITS, rendexInput } from './common';

let verifiedTlsAgent: Promise<unknown> | undefined;

const MAX_ERROR_TEXT = 500;
const MAX_WATCH_PAGES = 20;

class RendexApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({ message, status, responseBody }: { message: string; status: number; responseBody: unknown }) {
    super(message);
    this.name = 'RendexApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

function verifiedTls(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(
    ({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } })
  );
  return verifiedTlsAgent;
}

function apiKeyOf(raw: unknown): string {
  const key = rendexInput.optionalText(raw);
  if (key === undefined) {
    throw new Error('The Rendex connection has no API key. Reconnect it with a key (rdx_…) from the Rendex dashboard under API Keys.');
  }
  return key;
}

function segment({ value, label }: { value: unknown; label: string }): string {
  const text = typeof value === 'number' ? String(value) : rendexInput.optionalText(value);
  if (text === undefined || text === '.' || text === '..') {
    throw new Error(`${label} is required.`);
  }
  return encodeURIComponent(text);
}

function buildQuery(query: Record<string, QueryValue> | undefined): QueryParams {
  const result: QueryParams = {};
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null) continue;
    const text = String(value);
    if (text !== '') {
      result[key] = text;
    }
  }
  return result;
}

function clip(text: string): string {
  return text.length > MAX_ERROR_TEXT ? `${text.slice(0, MAX_ERROR_TEXT)}…` : text;
}

function detailsOf(details: unknown): string | undefined {
  if (!Array.isArray(details)) return undefined;
  const lines = details
    .filter(rendexInput.isRecord)
    .map((detail) => {
      const path = Array.isArray(detail['path']) ? detail['path'].join('.') : rendexInput.optionalText(detail['path']);
      const message = rendexInput.optionalText(detail['message']);
      if (message === undefined) return undefined;
      return path === undefined || path === '' ? message : `${path}: ${message}`;
    })
    .filter((line): line is string => line !== undefined)
    .slice(0, 10);
  return lines.length === 0 ? undefined : lines.join('; ');
}

function hintFor({ status, code }: { status: number; code: string | undefined }): string | undefined {
  if (code === 'KEY_DISABLED') return 'The API key was disabled or revoked; create a new key in the Rendex dashboard under API Keys and update the connection.';
  if (status === 401) return 'Check the API key on the Rendex connection (keys start with rdx_).';
  if (code === 'PLAN_UPGRADE_REQUIRED') return 'This option needs a paid Rendex plan.';
  if (status === 408 || code === 'TIMEOUT') return 'Raise Timeout (seconds) up to 60, or render a lighter page.';
  if (status === 413) return 'Send smaller content: HTML and Markdown up to 5 MB, Template Data up to 256 KB.';
  if (code === 'RATE_LIMITED') return 'You hit your plan\'s per-minute request limit; wait about a minute before the next call.';
  if (code === 'USAGE_EXCEEDED') return 'The monthly credit quota is used up; retrying will not help until it resets or you add credits.';
  if (code === 'WATCH_PAUSED') return 'Resume the watch with Update Watch first.';
  return undefined;
}

function sentence(text: string): string {
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function toApiError({ status, body, operation }: { status: number; body: unknown; operation: string }): RendexApiError {
  const envelope = rendexInput.isRecord(body) && rendexInput.isRecord(body['error']) ? body['error'] : undefined;
  const meta = rendexInput.isRecord(body) && rendexInput.isRecord(body['meta']) ? body['meta'] : undefined;
  const code = envelope === undefined ? undefined : rendexInput.optionalText(envelope['code']);
  const vendorMessage = envelope === undefined
    ? rendexInput.optionalText(body) ?? (rendexInput.isRecord(body) ? rendexInput.optionalText(body['message']) : undefined)
    : rendexInput.optionalText(envelope['message']);
  const details = envelope === undefined ? undefined : detailsOf(envelope['details']);
  const upgradeUrl = envelope === undefined ? undefined : rendexInput.optionalText(envelope['upgrade_url']);
  const requestId = meta === undefined ? undefined : rendexInput.optionalText(meta['requestId']);
  const hint = hintFor({ status, code });
  const head = `Rendex could not ${operation} (HTTP ${status}${code === undefined ? '' : ` ${code}`})`;
  const parts = [
    vendorMessage === undefined ? `${head}.` : `${head}: ${sentence(clip(vendorMessage))}`,
    details === undefined ? undefined : `Details: ${sentence(clip(details))}`,
    hint,
    upgradeUrl === undefined ? undefined : `Upgrade: ${upgradeUrl}`,
    requestId === undefined ? undefined : `Request ID: ${requestId}.`,
  ].filter((part): part is string => part !== undefined);
  return new RendexApiError({ message: parts.join(' '), status, responseBody: body });
}

function failureOf(error: unknown): { status: number; body: unknown } | null {
  if (error === null || typeof error !== 'object') return null;
  const response = Reflect.get(error, 'response');
  if (!rendexInput.isRecord(response)) return null;
  const status = response['status'];
  return typeof status === 'number' ? { status, body: response['body'] } : null;
}

function isAbort(error: unknown): boolean {
  if (error === null || typeof error !== 'object') return false;
  const name = Reflect.get(error, 'name');
  return name === 'AbortError' || name === 'TimeoutError';
}

function unwrap({ status, body, operation, allowEmpty }: { status: number; body: unknown; operation: string; allowEmpty: boolean }): RendexResult {
  if (body === undefined || body === null || body === '') {
    if (allowEmpty) {
      return { data: undefined, meta: undefined };
    }
    throw new RendexApiError({ message: `Rendex could not ${operation} (HTTP ${status}): the response was empty.`, status, responseBody: body });
  }
  if (!rendexInput.isRecord(body)) {
    const preview = typeof body === 'string' ? `: ${clip(body)}` : '.';
    throw new RendexApiError({ message: `Rendex could not ${operation} (HTTP ${status}): the response was not a JSON object${preview}`, status, responseBody: body });
  }
  if (body['success'] !== true) {
    throw toApiError({ status, body, operation });
  }
  return {
    data: body['data'],
    meta: rendexInput.isRecord(body['meta']) ? body['meta'] : undefined,
  };
}

async function send({ apiKey, method, path, query, body, timeoutMs, operation, allowEmpty }: SendParams): Promise<RendexResult> {
  const timeout = timeoutMs ?? RENDEX_LIMITS.READ_TIMEOUT_MS;
  const hasBody = body !== undefined && method !== HttpMethod.GET && method !== HttpMethod.DELETE;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }
  const dispatcher = await verifiedTls();
  let response: { status: number; body: unknown };
  try {
    response = await httpClient.sendRequest<unknown>(
      {
        method,
        url: `${RENDEX_BASE_URL}${path}`,
        headers,
        queryParams: buildQuery(query),
        body: hasBody ? body : undefined,
        timeout,
        retries: 0,
        followRedirects: false,
        redactBodyInErrors: true,
      },
      { dispatcher }
    );
  } catch (error) {
    const failure = failureOf(error);
    if (failure !== null) {
      throw toApiError({ ...failure, operation });
    }
    if (isAbort(error)) {
      throw new Error(`Rendex did not answer within ${Math.round(timeout / 1000)} s while trying to ${operation}. The call was not retried, because a retry could spend another credit. Try again later, or lower Timeout (seconds) or the page size.`);
    }
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Rendex could not ${operation}: could not reach api.rendex.dev (${clip(reason)}). Check your network and try again.`);
  }
  if (response.status >= 300) {
    throw new RendexApiError({
      message: `Rendex could not ${operation} (HTTP ${response.status}): the API answered with a redirect, which this piece does not follow.`,
      status: response.status,
      responseBody: response.body,
    });
  }
  return unwrap({ status: response.status, body: response.body, operation, allowEmpty: allowEmpty === true });
}

async function request({ auth, ...rest }: RequestParams): Promise<RendexResult> {
  return send({ ...rest, apiKey: apiKeyOf(auth.secret_text) });
}

async function requestData({ auth, ...rest }: RequestParams): Promise<Record<string, unknown>> {
  const { data } = await request({ auth, ...rest });
  if (!rendexInput.isRecord(data)) {
    throw new Error(`Rendex could not ${rest.operation}: the response had no data object.`);
  }
  return data;
}

async function listPage({ auth, path, query, operation }: { auth: RendexAuthValue; path: string; query: Record<string, QueryValue>; operation: string }): Promise<RendexPage> {
  const { data } = await request({ auth, method: HttpMethod.GET, path, query, operation });
  const record = rendexInput.isRecord(data) ? data : {};
  const items = Array.isArray(data) ? data : Array.isArray(record['items']) ? record['items'] : undefined;
  if (items === undefined) {
    throw new Error(`Rendex could not ${operation}: the response had no items list.`);
  }
  const nextCursor = rendexInput.optionalText(record['nextCursor']) ?? null;
  return { items: items.filter(rendexInput.isRecord), nextCursor, hasMore: nextCursor !== null };
}

async function listAllWatches({ auth }: { auth: RendexAuthValue }): Promise<Record<string, unknown>[]> {
  const pages: Record<string, unknown>[][] = [];
  const seen = new Set<string>();
  let cursor: string | undefined;
  for (let page = 0; page < MAX_WATCH_PAGES; page++) {
    const result = await listPage({
      auth,
      path: '/v1/watches',
      query: { status: 'all', limit: 100, cursor },
      operation: 'list your watches',
    });
    pages.push(result.items);
    if (result.nextCursor === null) {
      return pages.flat();
    }
    if (seen.has(result.nextCursor)) {
      throw new Error('Rendex returned the same page cursor twice while listing watches.');
    }
    seen.add(result.nextCursor);
    cursor = result.nextCursor;
  }
  throw new Error(`You have more than ${MAX_WATCH_PAGES * 100} watches, more than this list can load. Map a Watch ID from List Watches instead.`);
}

export { RendexApiError };

export const rendexClient = {
  send,
  request,
  requestData,
  listPage,
  listAllWatches,
  segment,
  apiKeyOf,
  verifiedTls,
};

type QueryValue = string | number | boolean | undefined | null;

type RendexAuthValue = { secret_text: string };

type RendexResult = { data: unknown; meta: Record<string, unknown> | undefined };

type RendexPage = { items: Record<string, unknown>[]; nextCursor: string | null; hasMore: boolean };

type SendParams = {
  apiKey: string;
  method: HttpMethod;
  path: string;
  query?: Record<string, QueryValue>;
  body?: Record<string, unknown>;
  timeoutMs?: number;
  operation: string;
  allowEmpty?: boolean;
};

type RequestParams = Omit<SendParams, 'apiKey'> & { auth: RendexAuthValue };

export type { RendexAuthValue, RendexResult, RendexPage, QueryValue };
