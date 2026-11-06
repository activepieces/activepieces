import { httpClient, HttpMessageBody, HttpMethod, HttpRequest, QueryParams } from '@activepieces/pieces-common';

export class WorkableApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({ message, status, responseBody }: { message: string; status: number; responseBody: unknown }) {
    super(message);
    this.name = 'WorkableApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function tokenOf(auth: unknown): string {
  const raw = typeof auth === 'string' ? auth : isRecord(auth) ? auth['secret_text'] : undefined;
  const token = typeof raw === 'string' ? raw.trim() : '';
  if (token.length === 0) {
    throw new Error('The Workable connection has no API access token.');
  }
  return token;
}

export function normalizeSubdomain(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new Error('Account Subdomain must be text, for example "acme" for acme.workable.com.');
  }
  const trimmed = value.trim().toLowerCase();
  if (trimmed.length === 0) {
    return undefined;
  }
  if (!SUBDOMAIN_PATTERN.test(trimmed)) {
    throw new Error(
      `Account Subdomain "${value}" is not valid. Enter only the subdomain, for example "acme" for acme.workable.com.`,
    );
  }
  return trimmed;
}

export function encodeId({ value, label }: { value: unknown; label: string }): string {
  const text = typeof value === 'number' && Number.isFinite(value) ? String(value) : typeof value === 'string' ? value.trim() : '';
  if (text.length === 0) {
    throw new Error(`${label} is required.`);
  }
  if (text === '.' || text === '..' || /[/\\?#]/.test(text)) {
    throw new Error(`${label} "${text}" is not a valid Workable ID.`);
  }
  return encodeURIComponent(text);
}

export function baseUrlFor(subdomain: string): string {
  return `https://${subdomain}.workable.com/spi/v3`;
}

export function isSameApiUrl({ subdomain, candidate }: { subdomain: string; candidate: string }): boolean {
  try {
    const target = new URL(candidate);
    const base = new URL(baseUrlFor(subdomain));
    return (
      target.protocol === 'https:' &&
      target.origin === base.origin &&
      target.username === '' &&
      target.password === '' &&
      (target.pathname === base.pathname || target.pathname.startsWith(`${base.pathname}/`)) &&
      !target.pathname.split('/').some((segment) => segment === '..' || segment === '.')
    );
  } catch {
    return false;
  }
}

export function cursorFromPaging({ subdomain, body }: { subdomain: string; body: unknown }): string | null {
  const paging = isRecord(body) ? body['paging'] : undefined;
  const next = isRecord(paging) ? paging['next'] : undefined;
  if (typeof next !== 'string' || next.length === 0) {
    return null;
  }
  if (!isSameApiUrl({ subdomain, candidate: next })) {
    throw new Error('Workable returned a next-page link for a different host, so it was not followed.');
  }
  const sinceId = new URL(next).searchParams.get('since_id');
  return sinceId === null || sinceId.length === 0 ? null : sinceId;
}

function errorDetail(responseBody: unknown): string | undefined {
  let parsed = responseBody;
  if (typeof parsed === 'string') {
    const trimmed = parsed.trim();
    if (trimmed.length === 0) {
      return undefined;
    }
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return trimmed.startsWith('<') ? undefined : trimmed.slice(0, 500);
    }
  }
  if (!isRecord(parsed)) {
    return undefined;
  }
  const validation = parsed['validation_errors'];
  if (isRecord(validation)) {
    const parts = Object.entries(validation).map(([field, messages]) =>
      `${field}: ${Array.isArray(messages) ? messages.map(String).join(', ') : String(messages)}`,
    );
    if (parts.length > 0) {
      return parts.join('; ').slice(0, 500);
    }
  }
  const single = parsed['error'] ?? parsed['message'];
  return typeof single === 'string' ? single.slice(0, 500) : undefined;
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Workable rejected the request as invalid',
  401: 'Workable rejected the API access token. Generate a new token in Settings → Integrations and update the connection',
  403: 'Workable denied access. The token may lack the scope for this step (r_jobs, r_candidates, w_candidates or w_comments)',
  404: 'Workable could not find the resource. Check the ID or shortcode and the account subdomain',
  409: 'Workable reported a conflict with the current state of the resource',
  422: 'Workable could not process the request',
  429: 'Workable rate limit reached (10 requests per 10 seconds for account tokens). Retry later',
};

export function buildWorkableError({ status, responseBody }: { status: number; responseBody: unknown }): WorkableApiError {
  const base =
    STATUS_MESSAGES[status] ??
    (status >= 500
      ? 'Workable returned a server error. Retry later'
      : status >= 300 && status < 400
        ? 'Workable answered with an unexpected redirect, which was not followed'
        : 'Workable request failed');
  const detail = errorDetail(responseBody);
  const message = detail === undefined ? `${base} (HTTP ${status}).` : `${base} (HTTP ${status}): ${detail}`;
  return new WorkableApiError({ message, status, responseBody });
}

function readHttpErrorResponse(error: unknown): { status: number; body: unknown } | undefined {
  if (!isRecord(error) && !(error instanceof Error)) {
    return undefined;
  }
  const response: unknown = Reflect.get(error, 'response');
  if (!isRecord(response)) {
    return undefined;
  }
  const status = response['status'];
  if (typeof status !== 'number') {
    return undefined;
  }
  return { status, body: response['body'] };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assertPath(path: string): void {
  if (
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('?') ||
    path.includes('#') ||
    path.includes('\\') ||
    path.split('/').some((segment) => segment === '..' || segment === '.')
  ) {
    throw new Error(`Refusing to call Workable with an unexpected path: ${path}`);
  }
}

async function send<T extends HttpMessageBody>({
  token,
  url,
  method,
  query,
  body,
}: {
  token: string;
  url: string;
  method: HttpMethod;
  query?: WorkableQuery;
  body?: unknown;
}): Promise<{ status: number; body: T }> {
  const queryParams: QueryParams = {};
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      queryParams[key] = String(value);
    }
  }
  const request: HttpRequest = {
    method,
    url,
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    queryParams,
    body,
    followRedirects: false,
    redactBodyInErrors: true,
    timeout: REQUEST_TIMEOUT_MS,
  };
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await httpClient.sendRequest<T>(request);
      if (response.status >= 300) {
        throw buildWorkableError({ status: response.status, responseBody: response.body });
      }
      return { status: response.status, body: response.body };
    } catch (error) {
      if (error instanceof WorkableApiError) {
        throw error;
      }
      const httpError = readHttpErrorResponse(error);
      if (httpError === undefined) {
        throw error;
      }
      if (httpError.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
        await sleep(RATE_LIMIT_WINDOW_MS);
        continue;
      }
      throw buildWorkableError({ status: httpError.status, responseBody: httpError.body });
    }
  }
}

export async function listAccounts(token: string): Promise<Record<string, unknown>[]> {
  const response = await send<Record<string, unknown>>({ token, url: `${ROOT_URL}/accounts`, method: HttpMethod.GET });
  const accounts = isRecord(response.body) ? response.body['accounts'] : undefined;
  return Array.isArray(accounts) ? accounts.filter(isRecord) : [];
}

export async function resolveSubdomain({ token, subdomain }: { token: string; subdomain?: unknown }): Promise<string> {
  const given = normalizeSubdomain(subdomain);
  if (given !== undefined) {
    return given;
  }
  const accounts = await listAccounts(token);
  const first = accounts.map((account) => normalizeSubdomainOrUndefined(account['subdomain'])).find((value) => value !== undefined);
  if (first === undefined) {
    throw new Error('This Workable token cannot see any account. Check that the token belongs to an active Workable account.');
  }
  return first;
}

function normalizeSubdomainOrUndefined(value: unknown): string | undefined {
  try {
    return normalizeSubdomain(value);
  } catch {
    return undefined;
  }
}

export function createWorkableClient({ auth, subdomain }: { auth: unknown; subdomain?: unknown }): WorkableClient {
  const token = tokenOf(auth);
  let resolved: Promise<string> | undefined;
  const getSubdomain = (): Promise<string> => {
    if (resolved === undefined) {
      resolved = resolveSubdomain({ token, subdomain });
      resolved.catch(() => {
        resolved = undefined;
      });
    }
    return resolved;
  };
  return {
    token,
    getSubdomain,
    async request<T extends HttpMessageBody = HttpMessageBody>({ method, path, query, body }: WorkableCallParams): Promise<T> {
      assertPath(path);
      const sub = await getSubdomain();
      const response = await send<T>({ token, url: `${baseUrlFor(sub)}${path}`, method, query, body });
      return response.body;
    },
  };
}

export type WorkableQuery = Record<string, string | number | boolean | undefined | null>;

export type WorkableCallParams = {
  method: HttpMethod;
  path: string;
  query?: WorkableQuery;
  body?: unknown;
};

export type WorkableClient = {
  token: string;
  getSubdomain: () => Promise<string>;
  request: <T extends HttpMessageBody = HttpMessageBody>(params: WorkableCallParams) => Promise<T>;
};

export const ROOT_URL = 'https://workable.com/spi/v3';
const SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const REQUEST_TIMEOUT_MS = 30000;
const MAX_RATE_LIMIT_RETRIES = 2;
const RATE_LIMIT_WINDOW_MS = 10000;
