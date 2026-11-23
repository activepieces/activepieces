import { createHash } from 'crypto';
import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  QueryParams,
} from '@activepieces/pieces-common';

const BASE_URL = 'https://api.sendpulse.com';
const REQUEST_TIMEOUT_MS = 30000;
const TOKEN_SAFETY_MARGIN_MS = 60000;
const MAX_CACHED_TOKENS = 200;

const tokenCache = new Map<string, CachedToken>();

class SendPulseApiError extends Error {
  readonly statusCode: number;
  readonly responseBody: unknown;

  constructor({ message, statusCode, responseBody }: { message: string; statusCode: number; responseBody: unknown }) {
    super(message);
    this.name = 'SendPulseApiError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cacheKey({ clientId, clientSecret }: SendPulseAuthProps): string {
  return createHash('sha256').update(`${clientId.trim()}\u0000${clientSecret.trim()}`).digest('hex');
}

function readHttpFailure(error: unknown): { status: number; body: unknown } | null {
  if (!isRecord(error) && !(error instanceof Error)) {
    return null;
  }
  const response: unknown = Reflect.get(Object(error), 'response');
  if (!isRecord(response)) {
    return null;
  }
  const status = response['status'];
  if (typeof status !== 'number') {
    return null;
  }
  return { status, body: response['body'] };
}

function extractVendorMessage(body: unknown): string | null {
  if (typeof body === 'string') {
    const trimmed = body.trim();
    if (trimmed.length === 0) {
      return null;
    }
    try {
      return extractVendorMessage(JSON.parse(trimmed)) ?? trimmed.slice(0, 500);
    } catch {
      return trimmed.slice(0, 500);
    }
  }
  if (!isRecord(body)) {
    return null;
  }
  for (const key of ['message', 'error_description', 'error']) {
    const value = body[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  const errors = body['errors'];
  if (isRecord(errors)) {
    const parts = Object.entries(errors).map(([field, detail]) => `${field}: ${Array.isArray(detail) ? detail.join(', ') : String(detail)}`);
    if (parts.length > 0) {
      return parts.join('; ');
    }
  }
  if (Array.isArray(errors) && errors.length > 0) {
    return errors.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join('; ');
  }
  return null;
}

function toSendPulseError({ error, operation, method }: { error: unknown; operation: string; method: HttpMethod }): Error {
  if (error instanceof SendPulseApiError) {
    return error;
  }
  const failure = readHttpFailure(error);
  if (failure) {
    const vendorMessage = extractVendorMessage(failure.body) ?? 'no error details returned';
    return new SendPulseApiError({
      message: `SendPulse ${operation} failed (HTTP ${failure.status}): ${vendorMessage}`,
      statusCode: failure.status,
      responseBody: failure.body,
    });
  }
  const reason = error instanceof Error ? error.message : String(error);
  const mayHaveApplied = method !== HttpMethod.GET ? ' The change may still have been applied; check SendPulse before retrying.' : '';
  return new SendPulseApiError({
    message: `SendPulse ${operation} failed: network error or timeout (${reason}).${mayHaveApplied}`,
    statusCode: 0,
    responseBody: null,
  });
}

async function requestAccessToken(auth: SendPulseAuthProps): Promise<CachedToken> {
  try {
    const response = await httpClient.sendRequest<HttpMessageBody>({
      method: HttpMethod.POST,
      url: `${BASE_URL}/oauth/access_token`,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: {
        grant_type: 'client_credentials',
        client_id: auth.clientId.trim(),
        client_secret: auth.clientSecret.trim(),
      },
      timeout: REQUEST_TIMEOUT_MS,
      redactBodyInErrors: true,
    });
    const body: unknown = response.body;
    const token = isRecord(body) ? body['access_token'] : undefined;
    const expiresIn = isRecord(body) ? Number(body['expires_in']) : NaN;
    if (typeof token !== 'string' || token.length === 0) {
      throw new SendPulseApiError({
        message: 'SendPulse authentication failed: the token response did not include an access token.',
        statusCode: response.status,
        responseBody: null,
      });
    }
    const lifetimeMs = Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn * 1000 : 3600 * 1000;
    return { token, expiresAt: Date.now() + Math.max(lifetimeMs - TOKEN_SAFETY_MARGIN_MS, 0) };
  } catch (error) {
    throw toSendPulseError({ error, operation: 'authentication', method: HttpMethod.GET });
  }
}

async function getAccessToken({ auth, useCache }: { auth: SendPulseAuthProps; useCache: boolean }): Promise<string> {
  const key = cacheKey(auth);
  if (useCache) {
    const cached = tokenCache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.token;
    }
  }
  const fresh = await requestAccessToken(auth);
  if (useCache) {
    if (tokenCache.size >= MAX_CACHED_TOKENS) {
      tokenCache.clear();
    }
    tokenCache.set(key, fresh);
  }
  return fresh.token;
}

function toQueryParams(query: SendPulseQuery | undefined): QueryParams {
  const queryParams: QueryParams = {};
  if (!query) {
    return queryParams;
  }
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      queryParams[key] = String(value);
    }
  }
  return queryParams;
}

async function sendpulseApiCall<T extends HttpMessageBody>({
  method,
  resourceUri,
  query,
  body,
  auth,
  operation,
  skipTokenCache,
}: SendPulseApiCallParams): Promise<T> {
  const label = operation ?? `${method} request`;
  const useCache = skipTokenCache !== true;
  const send = async (token: string): Promise<T> => {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${BASE_URL}${resourceUri}`,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      queryParams: toQueryParams(query),
      body,
      timeout: REQUEST_TIMEOUT_MS,
    });
    return response.body;
  };
  const token = await getAccessToken({ auth, useCache });
  try {
    return await send(token);
  } catch (error) {
    if (readHttpFailure(error)?.status !== 401) {
      throw toSendPulseError({ error, operation: label, method });
    }
  }
  tokenCache.delete(cacheKey(auth));
  const freshToken = await getAccessToken({ auth, useCache });
  try {
    return await send(freshToken);
  } catch (error) {
    throw toSendPulseError({ error, operation: label, method });
  }
}

function parseMailingListId(value: unknown): string {
  const raw = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : '';
  if (!/^\d+$/.test(raw) || Number(raw) <= 0) {
    throw new Error(`Invalid mailing list ID "${String(value)}". Use the numeric ID returned by "List Mailing Lists".`);
  }
  return raw;
}

function normalizeEmail(value: unknown): string {
  const email = typeof value === 'string' ? value.trim() : '';
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error(`Invalid email format: ${String(value)}`);
  }
  return email;
}

function sendpulseErrorStatus(error: unknown): number | null {
  if (error instanceof SendPulseApiError) {
    return error.statusCode;
  }
  const status: unknown = Reflect.get(Object(error), 'statusCode');
  return typeof status === 'number' ? status : null;
}

function findWebhookId({ response, action }: { response: unknown; action: string }): string | null {
  const data = isRecord(response) && 'data' in response ? response['data'] : response;
  const entries = (Array.isArray(data) ? data : [data]).filter(isRecord);
  const idOf = (entry: Record<string, unknown>): string | null => {
    const id = entry['id'];
    return typeof id === 'number' || (typeof id === 'string' && id.length > 0) ? String(id) : null;
  };
  const matching = entries.find((entry) => entry['action'] === action && idOf(entry) !== null);
  if (matching) {
    return idOf(matching);
  }
  const withId = entries.filter((entry) => idOf(entry) !== null);
  return withId.length === 1 ? idOf(withId[0]) : null;
}

async function createWebhook({ auth, url, action }: { auth: SendPulseAuthProps; url: string; action: string }): Promise<string> {
  const response = await sendpulseApiCall<unknown>({
    method: HttpMethod.POST,
    auth,
    resourceUri: '/v2/email-service/webhook',
    operation: 'create webhook',
    body: { url, actions: [action] },
  });
  const id = findWebhookId({ response, action });
  if (id === null) {
    throw new Error(`SendPulse create webhook returned no webhook ID for "${action}": ${JSON.stringify(response).slice(0, 500)}`);
  }
  return id;
}

async function deleteWebhook({ auth, webhookId }: { auth: SendPulseAuthProps; webhookId: string }): Promise<void> {
  try {
    await sendpulseApiCall<unknown>({
      method: HttpMethod.DELETE,
      auth,
      resourceUri: `/v2/email-service/webhook/${encodeURIComponent(webhookId)}`,
      operation: 'delete webhook',
    });
  } catch (error) {
    if (sendpulseErrorStatus(error) !== 404) {
      throw error;
    }
  }
}

function readWebhookEvents(body: unknown): Record<string, unknown>[] {
  if (Array.isArray(body)) {
    return body.filter(isRecord);
  }
  return isRecord(body) ? [body] : [];
}

function readWebhookEmail(item: Record<string, unknown>): string {
  if (typeof item['email'] === 'string' && item['email'] !== '') {
    return item['email'];
  }
  const variables = item['variables'];
  if (!isRecord(variables)) {
    return '';
  }
  const key = Object.keys(variables).find((name) => name.toLowerCase() === 'email');
  const value = key === undefined ? undefined : variables[key];
  return typeof value === 'string' ? value : '';
}

function epochToIso(value: unknown): string | null {
  const seconds = Number(value);
  if (value === null || value === undefined || value === '' || !Number.isFinite(seconds)) {
    return null;
  }
  return new Date(seconds * 1000).toISOString();
}

function clearSendPulseTokenCache(): void {
  tokenCache.clear();
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CachedToken = {
  token: string;
  expiresAt: number;
};

type SendPulseQuery = Record<string, string | number | boolean | undefined | null>;

export type SendPulseAuthProps = {
  clientId: string;
  clientSecret: string;
};

export type SendPulseApiCallParams = {
  method: HttpMethod;
  resourceUri: string;
  query?: SendPulseQuery;
  body?: HttpMessageBody;
  auth: SendPulseAuthProps;
  operation?: string;
  skipTokenCache?: boolean;
};

export {
  sendpulseApiCall,
  getAccessToken,
  parseMailingListId,
  normalizeEmail,
  isRecord,
  sendpulseErrorStatus,
  clearSendPulseTokenCache,
  findWebhookId,
  createWebhook,
  deleteWebhook,
  readWebhookEvents,
  readWebhookEmail,
  epochToIso,
  SendPulseApiError,
  BASE_URL as SENDPULSE_BASE_URL,
};
