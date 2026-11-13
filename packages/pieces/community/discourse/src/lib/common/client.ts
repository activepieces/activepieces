import { isIP } from 'net';
import {
  httpClient,
  HttpMessageBody,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { discourseNetwork } from './network-guard';

export class DiscourseApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({
    message,
    status,
    responseBody,
  }: {
    message: string;
    status: number;
    responseBody: unknown;
  }) {
    super(message);
    this.name = 'DiscourseApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return true;
  }
  return isIP(host) !== 0 && discourseNetwork.isBlockedIp(host);
}

export function normalizeBaseUrl(raw: unknown): string {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    throw new Error('Enter the Website URL of your Discourse forum, for example https://forum.example.com.');
  }
  const trimmed = raw.trim();
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new Error(`The Website URL "${trimmed}" is not a valid URL.`);
  }
  if (url.protocol !== 'https:') {
    throw new Error('The Website URL must start with https://. Plain http and other schemes are not allowed.');
  }
  if (url.username !== '' || url.password !== '') {
    throw new Error('The Website URL must not contain a user name or password.');
  }
  if (url.search !== '' || url.hash !== '' || trimmed.includes('?') || trimmed.includes('#')) {
    throw new Error('The Website URL must not contain a query string or fragment.');
  }
  if (isBlockedHost(url.hostname)) {
    throw new Error('The Website URL points to a local or private network address, which is not allowed.');
  }
  const segments = url.pathname.split('/').filter((segment) => segment.length > 0);
  if (segments.some((segment) => segment === '.' || segment === '..' || segment === '%2e' || segment === '%2e%2e')) {
    throw new Error('The Website URL must not contain . or .. path segments.');
  }
  const path = segments.length === 0 ? '' : `/${segments.join('/')}`;
  return `${url.origin}${path}`;
}

export function buildDiscourseUrl({
  baseUrl,
  path,
  query,
}: {
  baseUrl: string;
  path: string;
  query?: DiscourseQuery;
}): string {
  if (
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('?') ||
    path.includes('#') ||
    path.includes('\\') ||
    path.split('/').some((segment) => segment === '..' || segment === '.')
  ) {
    throw new Error(`Refusing to call Discourse with an unexpected path: ${path}`);
  }
  const url = new URL(baseUrl + path);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }
      if (Array.isArray(value)) {
        for (const item of value) {
          url.searchParams.append(`${key}[]`, String(item));
        }
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export function isSameInstanceUrl({ baseUrl, candidate }: { baseUrl: string; candidate: string }): boolean {
  try {
    const target = new URL(candidate, `${baseUrl}/`);
    const base = new URL(baseUrl);
    const prefix = base.pathname === '/' ? '' : base.pathname;
    return (
      target.origin === base.origin &&
      target.username === '' &&
      target.password === '' &&
      (prefix === '' || target.pathname === prefix || target.pathname.startsWith(`${prefix}/`))
    );
  } catch {
    return false;
  }
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
  const errors = parsed['errors'];
  if (Array.isArray(errors) && errors.length > 0) {
    return errors.map((item) => String(item)).join('; ').slice(0, 500);
  }
  const single = parsed['error'] ?? parsed['message'];
  return typeof single === 'string' ? single.slice(0, 500) : undefined;
}

export function retryWaitMs(responseBody: unknown): number {
  let parsed = responseBody;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      parsed = undefined;
    }
  }
  const extras = isRecord(parsed) ? parsed['extras'] : undefined;
  const seconds = isRecord(extras) ? Number(extras['wait_seconds']) : NaN;
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : DEFAULT_RETRY_SECONDS;
  return Math.min(safe, MAX_RETRY_WAIT_SECONDS) * 1000;
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Discourse rejected the request as invalid',
  401: 'Discourse rejected the API key. Check the API Key and API Username in the connection',
  403: 'Discourse denied access. The API key may lack the scope for this endpoint, need an admin (global) key, or the API Username may not be allowed to do this',
  404: 'Discourse could not find the resource. Check the ID or name, the Website URL and that the API Username can see it',
  409: 'Discourse reported a conflict with the current state of the resource',
  413: 'Discourse refused the request because it is too large',
  422: 'Discourse could not process the request',
  429: 'Discourse rate limit reached. Retry later',
};

export function buildDiscourseError({
  status,
  responseBody,
}: {
  status: number;
  responseBody: unknown;
}): DiscourseApiError {
  const base =
    STATUS_MESSAGES[status] ??
    (status >= 500
      ? 'Discourse returned a server error. Retry later'
      : status >= 300 && status < 400
        ? 'Discourse answered with an unexpected redirect, which was not followed'
        : 'Discourse request failed');
  const detail = errorDetail(responseBody);
  const message = detail === undefined ? `${base} (HTTP ${status}).` : `${base} (HTTP ${status}): ${detail}`;
  return new DiscourseApiError({ message, status, responseBody });
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

function isConnectFailure(error: unknown): boolean {
  return error instanceof TypeError && error.message === 'fetch failed';
}

const IDEMPOTENT_METHODS: string[] = [HttpMethod.GET, HttpMethod.PUT, HttpMethod.DELETE];
const MAX_CONNECT_RETRIES = 2;
const CONNECT_RETRY_WAIT_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function discourseRawRequest<T extends HttpMessageBody>({
  auth,
  method,
  path,
  query,
  body,
}: DiscourseCallParams): Promise<{ status: number; body: T; headers: Record<string, string | string[] | undefined> }> {
  const baseUrl = normalizeBaseUrl(auth.website_url);
  const apiKey = typeof auth.api_key === 'string' ? auth.api_key.trim() : '';
  const apiUsername = typeof auth.api_username === 'string' ? auth.api_username.trim() : '';
  if (apiKey.length === 0 || apiUsername.length === 0) {
    throw new Error('The Discourse connection needs both an API Key and an API Username.');
  }
  const request: HttpRequest = {
    method,
    url: buildDiscourseUrl({ baseUrl, path, query }),
    headers: {
      'Api-Key': apiKey,
      'Api-Username': apiUsername,
      Accept: 'application/json',
    },
    body,
    followRedirects: false,
    redactBodyInErrors: true,
    timeout: REQUEST_TIMEOUT_MS,
  };
  await discourseNetwork.assertPublicHost(new URL(baseUrl).hostname);
  const dispatcher = await discourseNetwork.getGuardedDispatcher();
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await httpClient.sendRequest<T>(request, { dispatcher });
      return { status: response.status, body: response.body, headers: response.headers ?? {} };
    } catch (error) {
      const httpError = readHttpErrorResponse(error);
      if (httpError === undefined) {
        if (isConnectFailure(error) && IDEMPOTENT_METHODS.includes(method) && attempt < MAX_CONNECT_RETRIES) {
          await sleep(CONNECT_RETRY_WAIT_MS);
          continue;
        }
        throw error;
      }
      if (httpError.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
        await sleep(retryWaitMs(httpError.body));
        continue;
      }
      throw buildDiscourseError({ status: httpError.status, responseBody: httpError.body });
    }
  }
}

export async function discourseRequest<T extends HttpMessageBody>(params: DiscourseCallParams): Promise<T> {
  const response = await discourseRawRequest<T>(params);
  if (response.status >= 300) {
    throw buildDiscourseError({ status: response.status, responseBody: response.body });
  }
  return response.body;
}

export function headerValue({
  headers,
  name,
}: {
  headers: Record<string, string | string[] | undefined> | undefined;
  name: string;
}): string | undefined {
  if (headers === undefined) {
    return undefined;
  }
  const match = Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase());
  const value = match?.[1];
  const single = Array.isArray(value) ? value[0] : value;
  return typeof single === 'string' && single.length > 0 ? single : undefined;
}

export type DiscourseCredentials = {
  api_key: string;
  api_username: string;
  website_url: string;
};

export type DiscourseQuery = Record<string, string | number | boolean | undefined | null | Array<string | number>>;

export type DiscourseCallParams = {
  auth: DiscourseCredentials;
  method: HttpMethod;
  path: string;
  query?: DiscourseQuery;
  body?: unknown;
};

const REQUEST_TIMEOUT_MS = 30000;
const MAX_RATE_LIMIT_RETRIES = 2;
const DEFAULT_RETRY_SECONDS = 5;
const MAX_RETRY_WAIT_SECONDS = 30;
