import { httpClient, HttpMessageBody, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

export type FormbricksAuthValue = {
  props: {
    appUrl: string;
    apiKey: string;
  };
};

export type FormbricksQuery = Record<string, string | number | boolean | undefined | null>;

export class FormbricksApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({ message, status, responseBody }: { message: string; status: number; responseBody: unknown }) {
    super(message);
    this.name = 'FormbricksApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeAppUrl(raw: string): string {
  const trimmed = (raw ?? '').trim();
  if (trimmed.length === 0) {
    throw new Error('Enter the Formbricks App URL, for example https://app.formbricks.com.');
  }
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new Error(`"${trimmed}" is not a valid URL. Use the address you open Formbricks at, for example https://app.formbricks.com.`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('The Formbricks App URL must start with https:// (or http:// for a self-hosted server).');
  }
  if (url.username !== '' || url.password !== '') {
    throw new Error('The Formbricks App URL must not contain a user name or password.');
  }
  let path = url.pathname.replace(/\/+$/, '');
  path = path.replace(/\/api(\/v[12])?(\/management)?$/i, '');
  path = path.replace(/\/+$/, '');
  return `${url.protocol}//${url.host}${path}`;
}

export function buildFormbricksUrl({ appUrl, path, query }: { appUrl: string; path: string; query?: FormbricksQuery }): string {
  if (
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('?') ||
    path.includes('#') ||
    path.split('/').some((segment) => segment === '..' || segment === '.')
  ) {
    throw new Error(`Refusing to call Formbricks with an unexpected path: ${path}`);
  }
  const url = new URL(normalizeAppUrl(appUrl) + path);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export function encodeId({ id, label }: { id: string; label: string }): string {
  const trimmed = (id ?? '').trim();
  if (trimmed.length === 0) {
    throw new Error(`${label} is required.`);
  }
  return encodeURIComponent(trimmed);
}

let verifiedTlsAgent: Promise<unknown> | undefined;

function verifiedTls(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
  return verifiedTlsAgent;
}

export async function formbricksRequest<T extends HttpMessageBody = HttpMessageBody>({
  auth,
  method,
  path,
  query,
  body,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: {
  auth: FormbricksAuthValue;
  method: HttpMethod;
  path: string;
  query?: FormbricksQuery;
  body?: unknown;
  timeoutMs?: number;
}): Promise<{ status: number; body: T }> {
  const request: HttpRequest = {
    method,
    url: buildFormbricksUrl({ appUrl: auth.props.appUrl, path, query }),
    headers: {
      'x-api-key': (auth.props.apiKey ?? '').trim(),
      Accept: 'application/json',
    },
    body,
    followRedirects: false,
    redactBodyInErrors: true,
    timeout: timeoutMs,
  };
  try {
    const response = await httpClient.sendRequest<T>(request, { dispatcher: await verifiedTls() });
    if (response.status >= 300) {
      throw buildFormbricksError({ status: response.status, responseBody: response.body });
    }
    return { status: response.status, body: response.body };
  } catch (error) {
    const mapped = toFormbricksError(error);
    if (mapped !== undefined) {
      throw mapped;
    }
    if (error instanceof Error) {
      throw new Error(`Could not reach Formbricks at ${normalizeAppUrl(auth.props.appUrl)}: ${error.message}`);
    }
    throw error;
  }
}

export async function formbricksData<T>(params: Parameters<typeof formbricksRequest>[0]): Promise<T> {
  const response = await formbricksRequest<{ data: T }>(params);
  const payload: unknown = response.body;
  if (!isRecord(payload) || !('data' in payload)) {
    throw new FormbricksApiError({
      message: 'Formbricks returned an unexpected response without a data field.',
      status: response.status,
      responseBody: payload,
    });
  }
  return response.body.data;
}

export function toFormbricksError(error: unknown): FormbricksApiError | undefined {
  if (error instanceof FormbricksApiError) {
    return error;
  }
  if (!isRecord(error) && !(error instanceof Error)) {
    return undefined;
  }
  const response: unknown = Reflect.get(error, 'response');
  if (!isRecord(response) || typeof response['status'] !== 'number') {
    return undefined;
  }
  return buildFormbricksError({ status: response['status'], responseBody: response['body'] });
}

export function isFormbricksStatus({ error, statuses }: { error: unknown; statuses: number[] }): boolean {
  const mapped = toFormbricksError(error);
  return mapped !== undefined && statuses.includes(mapped.status);
}

export function vendorDetail(responseBody: unknown): string | undefined {
  let parsed = responseBody;
  if (typeof parsed === 'string') {
    const trimmed = parsed.trim();
    if (trimmed.length === 0) {
      return undefined;
    }
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return trimmed.startsWith('<') ? undefined : trimmed.slice(0, MAX_DETAIL);
    }
  }
  if (!isRecord(parsed)) {
    return undefined;
  }
  const error = parsed['error'];
  if (isRecord(error)) {
    const parts: string[] = [];
    if (typeof error['message'] === 'string') {
      parts.push(error['message']);
    }
    if (error['details'] !== undefined) {
      parts.push(JSON.stringify(error['details']));
    }
    if (parts.length > 0) {
      return parts.join(' ').slice(0, MAX_DETAIL);
    }
  }
  const detail = parsed['message'] ?? parsed['details'] ?? error;
  if (typeof detail === 'string') {
    return detail.slice(0, MAX_DETAIL);
  }
  if (detail === undefined || detail === null) {
    return undefined;
  }
  return JSON.stringify(detail).slice(0, MAX_DETAIL);
}

export function buildFormbricksError({ status, responseBody }: { status: number; responseBody: unknown }): FormbricksApiError {
  const base =
    STATUS_MESSAGES[status] ??
    (status >= 500
      ? 'Formbricks returned a server error. Retry later'
      : status >= 300 && status < 400
        ? 'Formbricks answered with a redirect, which was not followed. Check the App URL in the connection'
        : 'Formbricks request failed');
  const detail = vendorDetail(responseBody);
  const message = detail === undefined ? `${base} (HTTP ${status}).` : `${base} (HTTP ${status}): ${detail}`;
  return new FormbricksApiError({ message, status, responseBody });
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Formbricks rejected the request as invalid',
  401: 'Formbricks rejected the API key. Check the API key in the Formbricks connection',
  403: 'Formbricks denied access. Check that the API key has write access to this workspace, or that your plan includes this feature',
  404: 'Formbricks could not find the resource. Check the ID and the App URL',
  409: 'Formbricks reported a conflict, for example a key that already exists',
  422: 'Formbricks could not process the request',
  429: 'Formbricks rate limit reached. Retry in a minute',
};

const DEFAULT_TIMEOUT_MS = 30000;
const MAX_DETAIL = 500;
