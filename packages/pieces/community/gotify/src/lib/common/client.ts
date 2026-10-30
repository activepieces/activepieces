import { httpClient, HttpMethod, HttpResponse, QueryParams } from '@activepieces/pieces-common';

const REQUEST_TIMEOUT_MS = 30_000;
let verifiedTlsAgent: Promise<unknown> | undefined;

export class GotifyApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseBody: unknown,
  ) {
    super(message);
    this.name = 'GotifyApiError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeBaseUrl(raw: unknown): string {
  const text = typeof raw === 'string' ? raw.trim() : '';
  if (!text) {
    throw new Error('The Gotify connection has no Server URL.');
  }
  let parsed: URL;
  try {
    parsed = new URL(text);
  } catch {
    throw new Error('The Gotify Server URL is not a valid URL. Use a full address like https://gotify.example.com.');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('The Gotify Server URL must start with http:// or https://.');
  }
  if (parsed.username || parsed.password) {
    throw new Error('The Gotify Server URL must not contain a username or password.');
  }
  if (parsed.search || parsed.hash || text.includes('?') || text.includes('#')) {
    throw new Error('The Gotify Server URL must not contain a query string or fragment.');
  }
  const path = parsed.pathname.replace(/\/+$/, '');
  if (path.split('/').some((part) => part === '..' || part === '.')) {
    throw new Error('The Gotify Server URL must not contain relative path segments.');
  }
  return `${parsed.origin}${path}`;
}

function tokenOf(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function appTokenOf(auth: GotifyAuthValue): string {
  const token = tokenOf(auth.app_token);
  if (!token) {
    throw new Error('The Gotify connection has no App Token.');
  }
  return token;
}

function clientTokenOf(auth: GotifyAuthValue): string {
  const token = tokenOf(auth.client_token);
  if (!token) {
    throw new Error(
      'This action needs a Client Token. Add one to the Gotify connection (Gotify web UI > Clients > Create Client). The App Token can only send messages.',
    );
  }
  return token;
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
  if (basePath === '') return true;
  return parsed.pathname === basePath || parsed.pathname.startsWith(`${basePath}/`);
}

function vendorMessage(body: unknown): string {
  if (isRecord(body)) {
    const description = body['errorDescription'];
    const error = body['error'];
    if (typeof description === 'string' && description.trim()) return description.trim();
    if (typeof error === 'string' && error.trim()) return error.trim();
  }
  if (typeof body === 'string' && body.trim()) return body.trim().slice(0, 300);
  return 'request failed';
}

function hintFor({ status, tokenKind }: { status: number; tokenKind: TokenKind }): string {
  if (status === 401) {
    return tokenKind === 'app'
      ? ' Check the App Token in the Gotify connection.'
      : ' Check the Client Token in the Gotify connection (an App Token does not work here).';
  }
  if (status === 403) return ' The token is valid but not allowed to do this (some endpoints need an admin user\'s client).';
  return '';
}

function toApiError({ status, body, tokenKind }: { status: number; body: unknown; tokenKind: TokenKind }): GotifyApiError {
  const base = status >= 300 && status < 400 ? 'unexpected redirect' : vendorMessage(body);
  return new GotifyApiError(`Gotify API error (${status}): ${base}.${hintFor({ status, tokenKind })}`, status, body);
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

async function request({ auth, method, path, query, body, tokenKind }: GotifyRequest): Promise<unknown> {
  const baseUrl = normalizeBaseUrl(auth.base_url);
  const headers: Record<string, string> = { accept: 'application/json' };
  if (tokenKind === 'app') headers['x-gotify-key'] = appTokenOf(auth);
  if (tokenKind === 'client') headers['x-gotify-key'] = clientTokenOf(auth);
  const hasBody = body !== undefined;
  if (hasBody) headers['content-type'] = 'application/json';
  const dispatcher = await verifiedTls();
  let status: number;
  let responseBody: unknown;
  try {
    const response: HttpResponse = await httpClient.sendRequest(
      {
        method,
        url: `${baseUrl}${path}`,
        headers,
        queryParams: buildQuery(query),
        body: hasBody ? body : undefined,
        timeout: REQUEST_TIMEOUT_MS,
        followRedirects: false,
      },
      { dispatcher },
    );
    status = response.status;
    responseBody = response.body;
  } catch (error) {
    const failure = failureOf(error);
    if (!failure) throw error;
    status = failure.status;
    responseBody = failure.body;
  }
  if (status < 200 || status >= 300) {
    throw toApiError({ status, body: responseBody, tokenKind });
  }
  return responseBody;
}

function buildQuery(query?: Record<string, string | number | undefined>): QueryParams {
  return Object.fromEntries(
    Object.entries(query ?? {})
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)]),
  );
}

function parseId({ value, label }: { value: unknown; label: string }): number {
  const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : '';
  if (!/^\d+$/.test(text) || Number(text) < 1 || !Number.isSafeInteger(Number(text))) {
    throw new Error(`${label} must be a positive whole number (the numeric Gotify ID).`);
  }
  return Number(text);
}

function parseOptionalInt({ value, label, min, max }: { value: unknown; label: string; min: number; max: number }): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = typeof value === 'string' ? Number(value.trim()) : value;
  if (typeof parsed !== 'number' || !Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${label} must be a whole number from ${min} to ${max}.`);
  }
  return parsed;
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text === '' ? undefined : text;
}

function withoutToken(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'token'));
}

function arrayOf(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export const gotifyClient = {
  request,
  normalizeBaseUrl,
  isSameOrigin,
  clientTokenOf,
  appTokenOf,
  parseId,
  parseOptionalInt,
  optionalText,
  withoutToken,
  arrayOf,
  isRecord,
};

type TokenKind = 'app' | 'client' | 'none';

export type GotifyAuthValue = {
  base_url: string;
  app_token: string;
  client_token?: string;
};

export type GotifyRequest = {
  auth: GotifyAuthValue;
  method: HttpMethod;
  path: string;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  tokenKind: TokenKind;
};
