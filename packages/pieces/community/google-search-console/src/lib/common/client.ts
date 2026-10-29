import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';

const BASE_URL = 'https://searchconsole.googleapis.com';
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_ERROR_TEXT = 500;

// The shared HTTP client turns off certificate checks for the whole process
// (NODE_TLS_REJECT_UNAUTHORIZED=0). An explicit rejectUnauthorized wins over that,
// so the OAuth token only goes to a server with a valid certificate.
let verifiedTlsAgent: Promise<unknown> | undefined;

function verifiedTls(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
  return verifiedTlsAgent;
}

export class GscApiError extends Error {
  readonly status: number;
  readonly reason: string | undefined;
  readonly responseBody: unknown;

  constructor({ operation, status, responseBody }: { operation: string; status: number; responseBody: unknown }) {
    super(`Google Search Console could not ${operation}: ${describeGscError({ status, responseBody })}`);
    this.name = 'GscApiError';
    this.status = status;
    this.reason = errorReason(responseBody);
    this.responseBody = responseBody;
  }
}

async function request<T>({
  auth,
  method,
  path,
  query,
  body,
  operation,
}: {
  auth: GscAuth;
  method: HttpMethod;
  path: string[];
  query?: Record<string, string | undefined>;
  body?: unknown;
  operation: string;
}): Promise<GscResponse<T>> {
  const url = `${BASE_URL}/${path.join('/')}`;
  try {
    const dispatcher = await verifiedTls();
    const response = await httpClient.sendRequest<T>({
      method,
      url,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      queryParams: toQueryParams(query),
      body,
      timeout: REQUEST_TIMEOUT_MS,
      followRedirects: false,
    }, { dispatcher });
    if (response.status >= 300) {
      throw new GscApiError({ operation, status: response.status, responseBody: 'Google answered with an unexpected redirect.' });
    }
    return { status: response.status, body: response.body };
  } catch (error) {
    if (error instanceof GscApiError) {
      throw error;
    }
    const status = statusOf(error);
    if (status === undefined) {
      throw error;
    }
    throw new GscApiError({ operation, status, responseBody: responseBodyOf(error) });
  }
}

function sitePath(siteUrl: string): string[] {
  return ['webmasters', 'v3', 'sites', encodeURIComponent(siteUrl)];
}

function toQueryParams(query: Record<string, string | undefined> | undefined): QueryParams | undefined {
  if (!query) {
    return undefined;
  }
  const entries = Object.entries(query).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].length > 0);
  return entries.length === 0 ? undefined : Object.fromEntries(entries);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function errorObject(responseBody: unknown): Record<string, unknown> | undefined {
  if (isRecord(responseBody) && isRecord(responseBody['error'])) {
    return responseBody['error'];
  }
  return undefined;
}

function errorReason(responseBody: unknown): string | undefined {
  const error = errorObject(responseBody);
  if (!error) {
    return undefined;
  }
  const details = Array.isArray(error['details']) ? error['details'].filter(isRecord) : [];
  const detailReason = details.map((detail) => detail['reason']).find((reason): reason is string => typeof reason === 'string');
  if (detailReason) {
    return detailReason;
  }
  const errors = Array.isArray(error['errors']) ? error['errors'].filter(isRecord) : [];
  const legacyReason = errors.map((item) => item['reason']).find((reason): reason is string => typeof reason === 'string');
  if (legacyReason) {
    return legacyReason;
  }
  return typeof error['status'] === 'string' ? error['status'] : undefined;
}

function vendorText(responseBody: unknown): string {
  const error = errorObject(responseBody);
  if (error && typeof error['message'] === 'string' && error['message'].trim().length > 0) {
    return error['message'].trim().slice(0, MAX_ERROR_TEXT);
  }
  if (typeof responseBody === 'string' && responseBody.trim().length > 0) {
    return responseBody.trim().slice(0, MAX_ERROR_TEXT);
  }
  if (isRecord(responseBody)) {
    return JSON.stringify(responseBody).slice(0, MAX_ERROR_TEXT);
  }
  return 'no details returned';
}

function describeGscError({ status, responseBody }: { status: number; responseBody: unknown }): string {
  const detail = `Google said: "${vendorText(responseBody)}" (HTTP ${status})`;
  const reason = errorReason(responseBody);
  if (status === 401) {
    return `the connection has expired or was revoked. Reconnect Google Search Console and try again. If your Google OAuth app is in Testing mode, its tokens expire after 7 days. ${detail}`;
  }
  if (status === 403 && (reason === 'SERVICE_DISABLED' || reason === 'accessNotConfigured')) {
    return `the Google Search Console API is not enabled in the Google Cloud project that owns this connection's OAuth client. Enable "Google Search Console API" in that project (APIs & Services > Library), wait a few minutes and try again. ${detail}`;
  }
  if (status === 403) {
    return `the connected Google account has no access to this property, or not enough access. The Site URL must match the property exactly as List Sites shows it (http vs https, www, trailing slash, or the "sc-domain:" prefix for domain properties). Unverified properties cannot be read, and adding or removing sitemaps needs Owner or Full permission. ${detail}`;
  }
  if (status === 404) {
    return `not found. Check the Site URL (exactly as List Sites shows it) and the sitemap URL. ${detail}`;
  }
  if (status === 429) {
    return `the Search Console quota was exceeded. Wait a few minutes; for Search Analytics, use a shorter date range or fewer dimensions; URL Inspection allows 2,000 inspections per property per day. ${detail}`;
  }
  if (status >= 500) {
    return `Google Search Console is temporarily unavailable. Try again later. ${detail}`;
  }
  if (status === 400) {
    return `Google rejected the request. ${detail}`;
  }
  return detail;
}

function statusOf(error: unknown): number | undefined {
  if (!(error instanceof Error)) {
    return undefined;
  }
  const response: unknown = Reflect.get(error, 'response');
  if (isRecord(response) && typeof response['status'] === 'number') {
    return response['status'];
  }
  return undefined;
}

function responseBodyOf(error: unknown): unknown {
  if (!(error instanceof Error)) {
    return undefined;
  }
  const response: unknown = Reflect.get(error, 'response');
  return isRecord(response) ? response['body'] : undefined;
}

export const gscClient = {
  request,
  sitePath,
  isRecord,
  describeGscError,
  BASE_URL,
};

export type GscAuth = { access_token: string };

export type GscResponse<T> = { status: number; body: T };
