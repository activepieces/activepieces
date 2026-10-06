import { AuthenticationType, HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import type { QueryParams } from '@activepieces/pieces-common';

export const GOOGLE_ADMIN_API_ROOT = 'https://admin.googleapis.com';
export const DIRECTORY_PATH = 'admin/directory/v1';
export const REPORTS_PATH = 'admin/reports/v1';
export const DATA_TRANSFER_PATH = 'admin/datatransfer/v1';
export const MY_CUSTOMER = 'my_customer';

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

  static fromHttpError(error: HttpError): GoogleWorkspaceApiError {
    const { status, body } = error.response;
    const parsed = toGoogleErrorBody(typeof body === 'string' ? safeJson(body) : body);

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

export const GoogleWorkspaceApi = {
  async request<T>({ auth, method, path, query, body }: ApiRequest): Promise<T> {
    const queryParams = toQueryParams(query);
    try {
      const response = await httpClient.sendRequest<T>({
        method,
        url: `${GOOGLE_ADMIN_API_ROOT}/${path.replace(/^\//, '')}`,
        ...(queryParams ? { queryParams } : {}),
        ...(body !== undefined ? { body } : {}),
        authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth.access_token },
      });
      return response.body;
    } catch (error) {
      if (error instanceof HttpError) {
        throw GoogleWorkspaceApiError.fromHttpError(error);
      }
      throw error;
    }
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
    } while (pageToken);
    return { items, truncated: false };
  },
};

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

function toQueryParams(query: QueryValues | undefined): QueryParams | undefined {
  if (!query) return undefined;
  const entries = Object.entries(query).filter(([, v]) => v !== undefined && v !== '');
  return entries.length > 0 ? Object.fromEntries(entries.map(([k, v]) => [k, String(v)])) : undefined;
}

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
