import { httpClient, HttpMethod, HttpResponse, QueryParams } from '@activepieces/pieces-common';

export const pastefyClient = { request, send, seg, isRecord, statusOf, instanceUrl, apiBase, tokenOf, requireToken, wholeNumber, toApiError, verifiedTls };

const DEFAULT_INSTANCE = 'https://pastefy.app';
const REQUEST_TIMEOUT_MS = 30_000;
let verifiedTlsAgent: Promise<unknown> | undefined;

export class PastefyApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseBody: unknown,
  ) {
    super(message);
    this.name = 'PastefyApiError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function instanceUrl({ auth }: { auth: PastefyAuthValue }): string {
  const raw = (auth.props.instance_url ?? '').trim() || DEFAULT_INSTANCE;
  const parsed = URL.canParse(raw) ? new URL(raw) : null;
  if (!parsed || (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('The Pastefy Instance URL must be a plain http(s) URL such as https://pastefy.app.');
  }
  return `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}`;
}

function apiBase({ auth }: { auth: PastefyAuthValue }): string {
  return `${instanceUrl({ auth })}/api/v2`;
}

function tokenOf({ auth }: { auth: PastefyAuthValue }): string | undefined {
  const token = (auth.props.token ?? '').trim();
  return token === '' ? undefined : token;
}

function requireToken({ auth }: { auth: PastefyAuthValue }): string {
  const token = tokenOf({ auth });
  if (!token) {
    throw new Error('This action needs an API key in the Pastefy connection. Create one at https://pastefy.app/apikeys and add it to the connection.');
  }
  return token;
}

function seg({ value, label }: { value: unknown; label: string }): string {
  const text = typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
  if (text === '' || text === '.' || text === '..') {
    throw new Error(`${label} is required.`);
  }
  return encodeURIComponent(text);
}

function exceptionOf(responseBody: unknown): string {
  if (isRecord(responseBody)) {
    const exception = responseBody['exception'];
    const message = responseBody['message'];
    if (typeof message === 'string' && message.trim()) return message.trim();
    if (typeof exception === 'string' && exception.trim()) return exception.trim();
  }
  if (typeof responseBody === 'string' && responseBody.trim()) {
    return responseBody.trim().slice(0, 300);
  }
  return 'request failed';
}

function hintFor({ status, exception }: { status: number; exception: string }): string {
  if (exception === 'PastePrivateException') return ' The paste is private and does not belong to this API key\'s account.';
  if (status === 401) return ' Check the API key in the Pastefy connection.';
  if (status === 403) return ' The API key lacks the permission this step needs (for example pastes:edit or folders:delete). Create a key with that permission.';
  if (status === 404) return ' Nothing with that ID exists on this Pastefy instance.';
  if (status === 429) return ' Pastefy rate limit reached; try again later.';
  return '';
}

function toApiError({ status, responseBody }: { status: number; responseBody: unknown }): PastefyApiError {
  const exception = status >= 300 && status < 400 ? 'unexpected redirect' : exceptionOf(responseBody);
  return new PastefyApiError(`Pastefy API error (${status}): ${exception}.${hintFor({ status, exception })}`, status, responseBody);
}

function buildQuery(query?: Record<string, QueryValue>): QueryParams {
  return Object.fromEntries(
    Object.entries(query ?? {})
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, String(value)]),
  );
}

function verifiedTls(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
  return verifiedTlsAgent;
}

function failureOf(error: unknown): { status: number; body: unknown } | null {
  if (error === null || typeof error !== 'object') return null;
  const response = Reflect.get(error, 'response');
  if (!isRecord(response)) return null;
  const status = response['status'];
  return typeof status === 'number' ? { status, body: response['body'] } : null;
}

async function send({ auth, method, path, query, body, allowAnonymous }: PastefyRequest): Promise<{ status: number; body: unknown }> {
  const token = allowAnonymous === true ? tokenOf({ auth }) : requireToken({ auth });
  const dispatcher = await verifiedTls();
  const hasBody = body !== undefined && method !== HttpMethod.GET && method !== HttpMethod.DELETE;
  const headers: Record<string, string> = { accept: 'application/json' };
  if (token) headers['authorization'] = `Bearer ${token}`;
  if (hasBody) headers['content-type'] = 'application/json';
  try {
    const response: HttpResponse = await httpClient.sendRequest(
      {
        method,
        url: `${apiBase({ auth })}${path}`,
        headers,
        queryParams: buildQuery(query),
        body: hasBody ? body : undefined,
        timeout: REQUEST_TIMEOUT_MS,
        followRedirects: false,
        redactBodyInErrors: true,
      },
      { dispatcher },
    );
    return { status: response.status, body: response.body };
  } catch (error) {
    const failure = failureOf(error);
    if (failure) return failure;
    throw error;
  }
}

async function request(req: PastefyRequest): Promise<unknown> {
  const response = await send(req);
  if (response.status < 200 || response.status >= 300) {
    throw toApiError({ status: response.status, responseBody: response.body });
  }
  if (isRecord(response.body) && response.body['success'] === false) {
    throw new PastefyApiError(`Pastefy did not apply the change: ${exceptionOf(response.body)}. The item may not exist or may belong to another account.`, response.status, response.body);
  }
  return response.body;
}

function statusOf(error: unknown): number | undefined {
  return error instanceof PastefyApiError ? error.status : undefined;
}

function wholeNumber({ value, label, min, max, fallback }: { value: unknown; label: string; min: number; max: number; fallback: number }): number {
  const parsed = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (parsed === undefined || parsed === null || parsed === '') return fallback;
  if (typeof parsed !== 'number' || !Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${label} must be a whole number from ${min} to ${max}.`);
  }
  return parsed;
}

type QueryValue = string | number | boolean | undefined | null;
export type PastefyAuthValue = { props: { instance_url?: string; token?: string } };
export type PastefyRequest = {
  auth: PastefyAuthValue;
  method: HttpMethod;
  path: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
  allowAnonymous?: boolean;
};
