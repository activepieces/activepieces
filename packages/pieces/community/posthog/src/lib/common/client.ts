import { httpClient, HttpMethod, HttpResponse, QueryParams } from '@activepieces/pieces-common';

const REQUEST_TIMEOUT_MS = 30_000;
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]'];
let verifiedTlsAgent: Promise<unknown> | undefined;

export class PostHogApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string | undefined,
    public readonly responseBody: unknown,
  ) {
    super(message);
    this.name = 'PostHogApiError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeHost({ raw, fallback, label }: { raw: unknown; fallback: string; label: string }): string {
  const text = typeof raw === 'string' ? raw.trim() : '';
  if (text === '') return fallback;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`;
  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    throw new Error(`The ${label} is not a valid URL. Use an address like ${fallback}.`);
  }
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && LOCAL_HOSTS.includes(parsed.hostname))) {
    throw new Error(`The ${label} must start with https:// (http:// is only allowed for localhost).`);
  }
  if (parsed.username || parsed.password) {
    throw new Error(`The ${label} must not contain a username or password.`);
  }
  if (parsed.search || parsed.hash || text.includes('?') || text.includes('#')) {
    throw new Error(`The ${label} must not contain a query string or fragment.`);
  }
  if (parsed.pathname.split('/').some((part) => part === '..' || part === '.') || /\/\.\.?(\/|$)/.test(text)) {
    throw new Error(`The ${label} must not contain relative path segments.`);
  }
  return `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}`;
}

function apiHostOf(auth: PostHogAuthValue): string {
  return normalizeHost({ raw: auth.api_host, fallback: DEFAULT_API_HOST, label: 'API Host' });
}

function ingestionHostOf(auth: PostHogAuthValue): string {
  return normalizeHost({ raw: auth.ingestion_host, fallback: DEFAULT_INGESTION_HOST, label: 'Ingestion Host' });
}

function keyOf(auth: PostHogAuthValue): string {
  const key = typeof auth.personal_api_key === 'string' ? auth.personal_api_key.trim() : '';
  if (!key) throw new Error('The PostHog connection has no Personal API Key.');
  return key;
}

function projectIdOf(auth: PostHogAuthValue): string {
  const id = typeof auth.project_id === 'string' || typeof auth.project_id === 'number' ? String(auth.project_id).trim() : '';
  if (!/^\d+$/.test(id)) throw new Error('The PostHog connection Project ID must be the number from the project URL (/project/{id}/).');
  return id;
}

function isSameOrigin({ url, baseUrl }: { url: string; baseUrl: string }): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.username || parsed.password) return false;
  const base = new URL(baseUrl);
  if (parsed.origin !== base.origin) return false;
  const basePath = base.pathname.replace(/\/+$/, '');
  return basePath === '' || parsed.pathname === basePath || parsed.pathname.startsWith(`${basePath}/`);
}

function hintFor(status: number): string {
  if (status === 401) return ' The Personal API Key is invalid or revoked; reconnect PostHog.';
  if (status === 403) return ' The Personal API Key lacks the scope for this request, or has no access to this project.';
  if (status === 404) return ' Check the project ID and the ID you passed.';
  if (status === 429) return ' PostHog is rate limiting this key; try again later.';
  return '';
}

function toApiError({ status, body }: { status: number; body: unknown }): PostHogApiError {
  let text = 'request failed';
  let code: string | undefined;
  if (status >= 300 && status < 400) {
    text = 'unexpected redirect (check the API Host)';
  } else if (isRecord(body)) {
    code = typeof body['code'] === 'string' ? body['code'] : undefined;
    const detail = body['detail'] ?? body['error'] ?? body['message'];
    if (typeof detail === 'string' && detail.trim()) text = detail.trim();
    else if (Object.keys(body).length > 0) text = JSON.stringify(body).slice(0, 300);
    const attr = typeof body['attr'] === 'string' ? body['attr'] : undefined;
    if (attr) text = `${attr}: ${text}`;
  } else if (typeof body === 'string' && body.trim()) {
    text = body.trim().slice(0, 300);
  }
  return new PostHogApiError(`PostHog API error (${status}): ${text.replace(/\.+$/, '')}.${hintFor(status)}`, status, code, body);
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

function buildQuery(query?: Record<string, string | number | boolean | undefined>): QueryParams {
  return Object.fromEntries(
    Object.entries(query ?? {})
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)]),
  );
}

async function send({ url, method, token, query, body }: SendParams): Promise<unknown> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (token !== undefined) headers['authorization'] = `Bearer ${token}`;
  if (body !== undefined) headers['content-type'] = 'application/json';
  const dispatcher = await verifiedTls();
  let response: HttpResponse;
  try {
    response = await httpClient.sendRequest(
      { method, url, headers, queryParams: buildQuery(query), body, timeout: REQUEST_TIMEOUT_MS, followRedirects: false },
      { dispatcher },
    );
  } catch (error) {
    const failure = failureOf(error);
    if (!failure) throw error;
    throw toApiError(failure);
  }
  if (response.status < 200 || response.status >= 300) throw toApiError({ status: response.status, body: response.body });
  return response.body;
}
async function request({ auth, method, path, query, body }: PostHogRequest): Promise<unknown> {
  return send({ url: `${apiHostOf(auth)}${path}`, method, token: keyOf(auth), query, body });
}
function projectPath({ auth, segments = [] }: { auth: PostHogAuthValue; segments?: (string | number)[] }): string {
  const rest = segments.map((s) => encodeURIComponent(String(s))).join('/');
  return `/api/projects/${projectIdOf(auth)}/${rest}${rest ? '/' : ''}`;
}
async function requestNext({ auth, url }: { auth: PostHogAuthValue; url: string }): Promise<unknown> {
  const base = apiHostOf(auth);
  if (!isSameOrigin({ url, baseUrl: base })) {
    throw new Error('PostHog returned a next-page link on another host; refusing to send the API key there.');
  }
  return send({ url, method: HttpMethod.GET, token: keyOf(auth) });
}

async function projectToken(auth: PostHogAuthValue): Promise<string> {
  const project = await request({ auth, method: HttpMethod.GET, path: projectPath({ auth }) });
  const token = isRecord(project) ? project['api_token'] : undefined;
  if (typeof token !== 'string' || token === '') throw new Error('PostHog did not return the project API token for this project.');
  return token;
}
async function ingest({ auth, path, body, query }: { auth: PostHogAuthValue; path: string; body: unknown; query?: Record<string, string> }): Promise<unknown> {
  return send({ url: `${ingestionHostOf(auth)}${path}`, method: HttpMethod.POST, query, body });
}

function arrayOf(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function recordOf(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function str(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function optionalText(value: unknown): string | undefined {
  if (typeof value === 'number') return String(value);
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text === '' ? undefined : text;
}

function requiredText({ value, label }: { value: unknown; label: string }): string {
  const text = optionalText(value);
  if (text === undefined) throw new Error(`${label} is required.`);
  return text;
}

function numericId({ value, label }: { value: unknown; label: string }): string {
  const text = requiredText({ value, label });
  if (!/^\d+$/.test(text)) throw new Error(`${label} must be a numeric ID.`);
  return text;
}

function parseInteger({ value, label, min, max, fallback }: { value: unknown; label: string; min: number; max: number; fallback: number }): number {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = typeof value === 'string' ? Number(value.trim()) : value;
  if (typeof parsed !== 'number' || !Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${label} must be a whole number from ${min} to ${max}.`);
  }
  return parsed;
}

function parseBoolean({ value, label }: { value: unknown; label: string }): boolean | undefined {
  const v = Array.isArray(value) && value.length === 1 ? value[0] : value;
  if (v === undefined || v === null || v === '') return undefined;
  if (v === true || v === 'true') return true;
  if (v === false || v === 'false') return false;
  throw new Error(`${label} must be true or false.`);
}

function plainObject({ value, label }: { value: unknown; label: string }): Record<string, unknown> | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error(`${label} must be a JSON object.`);
    }
  }
  if (!isRecord(parsed)) throw new Error(`${label} must be an object of key/value pairs.`);
  return parsed;
}

function isoTimestamp({ value, label }: { value: unknown; label: string }): string | undefined {
  const text = optionalText(value);
  if (text === undefined) return undefined;
  const time = Date.parse(text);
  if (Number.isNaN(time)) throw new Error(`${label} must be an ISO 8601 date-time, e.g. 2026-10-18T12:00:00Z.`);
  return new Date(time).toISOString();
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function uuid({ value, label }: { value: unknown; label: string }): string | undefined {
  const text = optionalText(value);
  if (text === undefined) return undefined;
  if (!UUID_RE.test(text)) throw new Error(`${label} must be a UUID like 0190a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b.`);
  return text.toLowerCase();
}

function userName(value: unknown): string | null {
  if (!isRecord(value)) return null;
  const name = [str(value['first_name']), str(value['last_name'])].filter((p): p is string => !!p && p.trim() !== '').join(' ').trim();
  return name === '' ? null : name;
}

export const DEFAULT_API_HOST = 'https://us.posthog.com';
export const DEFAULT_INGESTION_HOST = 'https://us.i.posthog.com';

export const posthogClient = {
  request,
  requestNext,
  projectPath,
  projectToken,
  ingest,
  normalizeHost,
  apiHostOf,
  isSameOrigin,
  keyOf,
  isRecord,
  arrayOf,
  recordOf,
  str,
  num,
  optionalText,
  requiredText,
  numericId,
  parseInteger,
  parseBoolean,
  plainObject,
  isoTimestamp,
  uuid,
  userName,
  toApiError,
  verifiedTls,
};

type SendParams = {
  url: string;
  method: HttpMethod;
  token?: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};

export type PostHogAuthValue = {
  personal_api_key: string;
  project_id: string;
  api_host?: string;
  ingestion_host?: string;
};

export type PostHogRequest = {
  auth: PostHogAuthValue;
  method: HttpMethod;
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};
