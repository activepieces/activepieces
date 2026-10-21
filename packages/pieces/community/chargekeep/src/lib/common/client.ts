import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';

export const CHARGEKEEP_BASE_URLS = ['https://crm.chargekeep.com', 'https://beta.chargekeep.com'];

const REQUEST_TIMEOUT_MS = 60_000;

export class ChargekeepApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseBody: unknown,
  ) {
    super(message);
    this.name = 'ChargekeepApiError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function propsOf(auth: unknown): Record<string, unknown> {
  if (isRecord(auth) && isRecord(auth['props'])) return auth['props'];
  if (isRecord(auth)) return auth;
  return {};
}

function baseUrlOf(auth: unknown): string {
  const raw = propsOf(auth)['base_url'];
  const url = typeof raw === 'string' ? raw.trim().replace(/\/+$/, '') : '';
  if (!CHARGEKEEP_BASE_URLS.includes(url)) {
    throw new Error(`The ChargeKeep connection has an unknown Base URL. Pick one of: ${CHARGEKEEP_BASE_URLS.join(', ')}.`);
  }
  return url;
}

function keyOf(auth: unknown): string {
  const raw = propsOf(auth)['api_key'];
  const key = typeof raw === 'string' ? raw.trim() : '';
  if (key === '') throw new Error('The ChargeKeep connection has no API key. Reconnect ChargeKeep with an API key.');
  return key;
}

function headersOf(auth: unknown): Record<string, string> {
  return { 'api-key': keyOf(auth) };
}

function hintFor(status: number): string {
  if (status === 401) return ' The API key is invalid or revoked; reconnect ChargeKeep.';
  if (status === 403) return ' The API key user is not allowed to do this.';
  if (status === 404) return ' Check the ID you passed.';
  if (status === 429) return ' ChargeKeep is rate limiting this API key; try again later.';
  return '';
}

function messageOf(body: unknown): string | undefined {
  if (typeof body === 'string') return body.trim() === '' ? undefined : body.trim().slice(0, 300);
  if (!isRecord(body)) return undefined;
  const err = body['error'];
  if (!isRecord(err)) return undefined;
  const parts: string[] = [];
  if (typeof err['message'] === 'string' && err['message'].trim()) parts.push(err['message'].trim());
  const validation = err['validationErrors'];
  if (!Array.isArray(validation) && typeof err['details'] === 'string' && err['details'].trim()) parts.push(err['details'].trim());
  if (Array.isArray(validation)) {
    for (const v of validation) {
      if (isRecord(v) && typeof v['message'] === 'string') {
        const members = Array.isArray(v['members']) ? v['members'].filter((m) => typeof m === 'string').join(', ') : '';
        parts.push(members ? `${members}: ${v['message']}` : v['message']);
      }
    }
  }
  return parts.length > 0 ? parts.join(' — ').slice(0, 1000) : undefined;
}

function toApiError({ status, body }: { status: number; body: unknown }): ChargekeepApiError {
  const text = status >= 300 && status < 400 ? 'unexpected redirect' : messageOf(body) ?? 'request failed';
  return new ChargekeepApiError(`ChargeKeep API error (${status}): ${text.replace(/\.+$/, '')}.${hintFor(status)}`, status, body);
}

function failureOf(error: unknown): { status: number; body: unknown } | null {
  if (error === null || typeof error !== 'object') return null;
  const response = Reflect.get(error, 'response');
  if (!isRecord(response)) return null;
  const status = response['status'];
  return typeof status === 'number' ? { status, body: response['body'] } : null;
}

function normalizePath(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(path)) {
    throw new Error('ChargeKeep request paths must be relative (start with a single "/").');
  }
  if (path.split(/[/?#]/).some((part) => part === '..' || part.toLowerCase() === '%2e%2e')) {
    throw new Error('ChargeKeep request paths must not contain ".." segments.');
  }
  return path;
}

function buildQuery(query?: ChargekeepQuery): QueryParams {
  const qs: QueryParams = {};
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    qs[key] = String(value);
  }
  return qs;
}

async function send({ auth, method, path, query, body }: ChargekeepRequest): Promise<ChargekeepResponse> {
  const url = `${baseUrlOf(auth)}${normalizePath(path)}`;
  let response: { status: number; body: unknown };
  try {
    response = await httpClient.sendRequest({
      method,
      url,
      headers: { ...headersOf(auth), accept: 'application/json', ...(body !== undefined ? { 'content-type': 'application/json' } : {}) },
      queryParams: buildQuery(query),
      body,
      timeout: REQUEST_TIMEOUT_MS,
      followRedirects: false,
    });
  } catch (error) {
    const failure = failureOf(error);
    if (!failure) throw error;
    throw toApiError(failure);
  }
  if (response.status < 200 || response.status >= 300) throw toApiError(response);
  if (response.status === 204) return { status: 204, body: undefined, result: undefined };
  const envelope = response.body;
  if (!isRecord(envelope)) {
    throw new ChargekeepApiError(`ChargeKeep API error (${response.status}): the response was not JSON. Check the Base URL.`, response.status, envelope);
  }
  if (envelope['success'] === false || envelope['unAuthorizedRequest'] === true) {
    throw toApiError({ status: envelope['unAuthorizedRequest'] === true ? 401 : response.status, body: envelope });
  }
  return { status: response.status, body: envelope, result: 'result' in envelope ? envelope['result'] : envelope };
}

async function request(params: ChargekeepRequest): Promise<unknown> {
  return (await send(params)).result;
}

function positiveId({ value, label }: { value: unknown; label: string }): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isInteger(n) || n < 0) throw new Error(`${label} must be a whole number.`);
  return n > 0 ? n : undefined;
}

function text(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const s = String(value).trim();
  return s === '' ? undefined : s;
}

function compactValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((v) => compactValue(v));
  return isRecord(value) ? compact(value) : value;
}

function compact(value: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    if (v === undefined || v === null || v === '') continue;
    const c = compactValue(v);
    if (isRecord(c) && Object.keys(c).length === 0) continue;
    out[k] = c;
  }
  return out;
}

export const chargekeepClient = { send, request, baseUrlOf, keyOf, headersOf, isRecord, positiveId, text, compact, normalizePath };

export type ChargekeepQuery = Record<string, string | number | boolean | undefined | null>;

export type ChargekeepRequest = {
  auth: unknown;
  method: HttpMethod;
  path: string;
  query?: ChargekeepQuery;
  body?: unknown;
};

export type ChargekeepResponse = { status: number; body: unknown; result: unknown };
