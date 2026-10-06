import { HttpMethod } from '@activepieces/pieces-common';

export class GoogleWorkspaceApiError extends Error {
  readonly status: number;
  readonly googleStatus: string | undefined;
  readonly errors: GoogleWorkspaceErrorDetail[];

  constructor({ status, googleStatus, errors, summary }: GoogleWorkspaceApiErrorParams) {
    super(summary);
    this.name = 'GoogleWorkspaceApiError';
    this.status = status;
    this.googleStatus = googleStatus;
    this.errors = errors;
  }

  static fromResponse({ status, text }: { status: number; text: string }): GoogleWorkspaceApiError {
    const body = safeJson(text);
    const parsed = toGoogleErrorBody(body);

    const errors: GoogleWorkspaceErrorDetail[] = (parsed.error?.errors ?? []).map((e) => ({
      reason: e.reason ?? 'unknown',
      message: e.message ?? '',
      ...(e.domain ? { domain: e.domain } : {}),
      ...(e.location ? { location: e.location } : {}),
    }));

    const googleStatus = parsed.error?.status;
    const head = `Google Workspace API returned ${status}${googleStatus ? ` (${googleStatus})` : ''}`;
    const detail =
      errors.length > 0
        ? errors.map((e) => `${e.reason}: ${e.message}${e.location ? ` [${e.location}]` : ''}`).join('; ')
        : parsed.error?.message ?? rawBodySummary(body);

    return new GoogleWorkspaceApiError({
      status,
      googleStatus,
      errors,
      summary: `${head}: ${detail}${hintFor({ status, errors })}`,
    });
  }

  hasReason(reason: string): boolean {
    return this.errors.some((e) => e.reason === reason);
  }
}

export function assertCustomApiCallUrl(propsValue: unknown): void {
  const urlProp = isRecord(propsValue) ? propsValue['url'] : undefined;
  const url = isRecord(urlProp) ? urlProp['url'] : undefined;
  if (typeof url !== 'string' || !(url.startsWith('http://') || url.startsWith('https://'))) {
    return;
  }
  const allowed = new URL(GOOGLE_ADMIN_API_ROOT).origin;
  let origin: string;
  try {
    origin = new URL(url).origin;
  } catch {
    throw new Error(`The URL "${url}" is not valid. Use a path relative to ${GOOGLE_ADMIN_API_ROOT}, e.g. /${DIRECTORY_PATH}/users.`);
  }
  if (origin !== allowed) {
    throw new Error(
      `Custom API Call only sends the Google Workspace credentials to ${allowed}, not to ${origin}. Use a path relative to ${GOOGLE_ADMIN_API_ROOT} (e.g. /${DIRECTORY_PATH}/users) or a full URL on that host.`
    );
  }
}

function hintFor({ status, errors }: { status: number; errors: GoogleWorkspaceErrorDetail[] }): string {
  const reasons = new Set(errors.map((e) => e.reason));
  if (status === 403 && reasons.has('accessNotConfigured')) {
    return ' Enable the Admin SDK API in the Google Cloud project that owns the OAuth client or service account.';
  }
  if (status === 403 && (reasons.has('forbidden') || reasons.has('insufficientPermissions'))) {
    return ' The connected account lacks the admin privilege or the OAuth scope for this call; reconnect granting every scope, or use an account with the right admin role.';
  }
  if (status === 404) {
    return ' Check the identifier: user and group keys are e-mails or ids, org units are paths, devices use their resource id.';
  }
  if (status === 409) {
    return ' A record with that key already exists.';
  }
  return '';
}

function rawBodySummary(body: unknown): string {
  if (typeof body !== 'string') return JSON.stringify(body ?? null);
  if (/^\s*<(!doctype|html)/i.test(body)) {
    const title = /<title>([^<]*)<\/title>/i.exec(body)?.[1]?.trim();
    const url = /<code>([^<]*)<\/code>/i.exec(body)?.[1]?.trim();
    return `${title ?? 'HTML error page'}${url ? ` for ${url}` : ''} (the request URL is malformed, usually an empty identifier).`;
  }
  return body.length > 500 ? `${body.slice(0, 500)}...` : body;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function toGoogleErrorBody(value: unknown): GoogleErrorBody {
  if (!isRecord(value) || !isRecord(value['error'])) {
    return {};
  }
  const error = value['error'];
  const errors = error['errors'];
  return {
    error: {
      message: optionalString(error['message']),
      status: optionalString(error['status']),
      errors: Array.isArray(errors) ? errors.map((entry) => (isRecord(entry) ? toGoogleErrorEntry(entry) : {})) : undefined,
    },
  };
}

function toGoogleErrorEntry(entry: Record<string, unknown>): GoogleErrorEntry {
  return {
    domain: optionalString(entry['domain']),
    reason: optionalString(entry['reason']),
    message: optionalString(entry['message']),
    location: optionalString(entry['location']),
  };
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function requestUrl({ path, query }: { path: string; query: QueryValues | undefined }): string {
  const url = new URL(`${GOOGLE_ADMIN_API_ROOT}/${path.replace(/^\//, '')}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function send({ url, method, token, body, timeoutMs }: SendParams): Promise<RawResponse> {
  const payload = body === undefined ? undefined : JSON.stringify(body);
  try {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...(payload === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(payload === undefined ? {} : { body: payload }),
      signal: AbortSignal.timeout(requestTimeout(timeoutMs)),
    });
    return { status: response.status, ok: response.ok, text: await response.text() };
  } catch (error) {
    const reason = error instanceof Error ? error.name : 'unknown error';
    throw new Error(`Could not reach the Google Workspace API (${reason}). Try again in a moment.`);
  }
}

function requestTimeout(timeoutMs: number | undefined): number {
  if (timeoutMs === undefined) return REQUEST_TIMEOUT_MS;
  return Math.min(REQUEST_TIMEOUT_MS, Math.max(1, Math.ceil(timeoutMs)));
}

function parseSuccessBody<T>({ status, text }: { status: number; text: string }): T {
  const source = text.trim() === '' ? EMPTY_JSON_BODY : text;
  try {
    return JSON.parse(source);
  } catch {
    throw new GoogleWorkspaceApiError({
      status,
      googleStatus: undefined,
      errors: [],
      summary: `Google Workspace API returned ${status} with a response that is not JSON.`,
    });
  }
}

export const GoogleWorkspaceApi = {
  async request<T>({ auth, method, path, query, body, timeoutMs }: ApiRequest): Promise<T> {
    const response = await send({ url: requestUrl({ path, query }), method, token: auth.access_token, body, timeoutMs });
    if (!response.ok) {
      throw GoogleWorkspaceApiError.fromResponse({ status: response.status, text: response.text });
    }
    return parseSuccessBody<T>({ status: response.status, text: response.text });
  },

  async listPage<T>({ auth, path, itemsKey, query = {} }: ListPageRequest): Promise<ListPage<T>> {
    const body = await this.request<ListResponse<T>>({ auth, method: HttpMethod.GET, path, query });
    const rawItems = body[itemsKey];
    const items = Array.isArray(rawItems) ? rawItems : [];
    const rawToken = body['nextPageToken'];
    const nextPageToken = typeof rawToken === 'string' ? rawToken : undefined;
    return { items, ...(nextPageToken ? { nextPageToken } : {}) };
  },

  async listAll<T>({
    auth,
    path,
    itemsKey,
    query = {},
    maxRows = 2000,
  }: ListAllRequest): Promise<{ items: T[]; truncated: boolean }> {
    const items: T[] = [];
    let pageToken: string | undefined;
    do {
      const page = await this.listPage<T>({ auth, path, itemsKey, query: { ...query, pageToken } });
      for (const item of page.items) {
        if (items.length >= maxRows) {
          return { items, truncated: true };
        }
        items.push(item);
      }
      pageToken = page.nextPageToken;
      if (items.length >= maxRows) {
        return { items, truncated: Boolean(pageToken) };
      }
    } while (pageToken);
    return { items, truncated: false };
  },
};

export const GOOGLE_ADMIN_API_ROOT = 'https://admin.googleapis.com';
export const DIRECTORY_PATH = 'admin/directory/v1';
export const REPORTS_PATH = 'admin/reports/v1';
export const DATA_TRANSFER_PATH = 'admin/datatransfer/v1';
export const MY_CUSTOMER = 'my_customer';
const REQUEST_TIMEOUT_MS = 60_000;
const EMPTY_JSON_BODY = '{}';

type SendParams = { url: string; method: HttpMethod; token: string; body: unknown; timeoutMs: number | undefined };

type RawResponse = { status: number; ok: boolean; text: string };

type GoogleErrorEntry = { domain?: string; reason?: string; message?: string; location?: string };

type GoogleErrorBody = {
  error?: {
    message?: string;
    status?: string;
    errors?: GoogleErrorEntry[];
  };
};

type ListResponse<T> = Record<string, T[] | string | undefined>;

type GoogleWorkspaceApiErrorParams = {
  status: number;
  googleStatus: string | undefined;
  errors: GoogleWorkspaceErrorDetail[];
  summary: string;
};

type ListPageRequest = {
  auth: ResolvedAuth;
  path: string;
  itemsKey: string;
  query?: QueryValues;
};

type ListAllRequest = ListPageRequest & { maxRows?: number };

export type QueryValues = Record<string, string | number | boolean | undefined>;

export type ResolvedAuth = { access_token: string };

export type ApiRequest = {
  auth: ResolvedAuth;
  method: HttpMethod;
  path: string;
  query?: QueryValues;
  body?: unknown;
  timeoutMs?: number;
};

export type ListPage<T> = {
  items: T[];
  nextPageToken?: string;
};

export type GoogleWorkspaceErrorDetail = {
  reason: string;
  message: string;
  domain?: string;
  location?: string;
};
