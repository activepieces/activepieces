import { httpClient, HttpError, HttpMessageBody, HttpMethod } from '@activepieces/pieces-common';
import { sprinklrEndpoints, SearchEntity } from './endpoints';
import { sprinklrEnvironments } from './environments';
import { SprinklrApiError, sprinklrErrors } from './errors';

const RATE_LIMIT_DELAYS_MS = [1000, 2000, 4000];
const SERVER_RETRY_DELAYS_MS = [1000, 2000];
const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_RESULTS = 20;

const sprinklrTiming = {
  sleep: (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms)),
};

function connectionFrom(auth: SprinklrAuthValue): SprinklrConnection {
  const base = auth.props?.['base'];
  if (typeof base !== 'string' || base.trim().length === 0) {
    throw new Error('The Sprinklr connection has no Environment. Edit the connection, choose the Environment and reconnect.');
  }
  const apiKey = auth.client_id;
  if (typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    throw new Error('The Sprinklr connection has no API key. Reconnect it and paste the Sprinklr API key into Client ID.');
  }
  if (typeof auth.access_token !== 'string' || auth.access_token.length === 0) {
    throw new Error('The Sprinklr connection has no access token. Reconnect it.');
  }
  return {
    baseUrl: sprinklrEnvironments.trimBase(base),
    apiBaseUrl: sprinklrEnvironments.apiBaseUrl(base),
    accessToken: auth.access_token,
    apiKey,
  };
}

function authHeaders(auth: SprinklrAuthValue): Record<string, string> {
  const connection = connectionFrom(auth);
  return {
    Authorization: `Bearer ${connection.accessToken}`,
    Key: connection.apiKey,
  };
}

function buildUrl({ apiBaseUrl, path, query }: { apiBaseUrl: string; path: string; query?: SprinklrQuery }): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null) {
      search.append(key, String(value));
    }
  }
  const queryString = search.toString();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return queryString.length > 0 ? `${apiBaseUrl}${normalizedPath}?${queryString}` : `${apiBaseUrl}${normalizedPath}`;
}

function isEmptyData(data: unknown): boolean {
  if (data === undefined || data === null) {
    return true;
  }
  if (Array.isArray(data)) {
    return data.length === 0;
  }
  return sprinklrErrors.isRecord(data) && Object.keys(data).length === 0;
}

function unwrap(body: HttpMessageBody): HttpMessageBody {
  if (sprinklrErrors.isRecord(body) && 'data' in body) {
    return body['data'];
  }
  return body;
}

function errorsOnSuccess({ body, method, path }: { body: unknown; method: HttpMethod; path: string }): SprinklrApiError | undefined {
  if (!sprinklrErrors.isRecord(body)) {
    return undefined;
  }
  const errors = body['errors'];
  if (!Array.isArray(errors) || errors.length === 0) {
    return undefined;
  }
  if ('data' in body ? !isEmptyData(body['data']) : Object.keys(body).some((key) => !['errors', 'success', 'metadata'].includes(key))) {
    return undefined;
  }
  return sprinklrErrors.fromResponse({ status: 200, body, method, path, sideEffectPossible: false });
}

async function send({
  auth,
  method,
  path,
  query,
  body,
  retryOn5xx = true,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  sleep,
}: SprinklrRequest): Promise<SprinklrResponse> {
  const connection = connectionFrom(auth);
  const url = buildUrl({ apiBaseUrl: connection.apiBaseUrl, path, query });
  const wait = sleep ?? sprinklrTiming.sleep;
  let rateLimitRetries = 0;
  let serverRetries = 0;
  for (;;) {
    try {
      const response = await httpClient.sendRequest({
        method,
        url,
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
          Key: connection.apiKey,
          Accept: 'application/json',
        },
        body,
        timeout: timeoutMs,
        retries: 0,
      });
      const raw: HttpMessageBody = response.body;
      const failure = errorsOnSuccess({ body: raw, method, path });
      if (failure) {
        throw failure;
      }
      return { status: response.status, data: unwrap(raw), raw };
    } catch (error) {
      if (error instanceof SprinklrApiError) {
        throw error;
      }
      if (error instanceof HttpError) {
        const status = error.response.status;
        const responseBody = error.response.body;
        if (sprinklrErrors.isRateLimited({ status, body: responseBody })) {
          if (rateLimitRetries < RATE_LIMIT_DELAYS_MS.length) {
            await wait(RATE_LIMIT_DELAYS_MS[rateLimitRetries]);
            rateLimitRetries += 1;
            continue;
          }
        } else if (status >= 500 && retryOn5xx && serverRetries < SERVER_RETRY_DELAYS_MS.length) {
          await wait(SERVER_RETRY_DELAYS_MS[serverRetries]);
          serverRetries += 1;
          continue;
        }
        throw sprinklrErrors.fromResponse({ status, body: responseBody, method, path, sideEffectPossible: !retryOn5xx });
      }
      if (retryOn5xx && serverRetries < SERVER_RETRY_DELAYS_MS.length) {
        await wait(SERVER_RETRY_DELAYS_MS[serverRetries]);
        serverRetries += 1;
        continue;
      }
      throw sprinklrErrors.fromNetwork({ error, method, path, sideEffectPossible: !retryOn5xx });
    }
  }
}

async function request<T = HttpMessageBody>(params: SprinklrRequest): Promise<T> {
  const response = await send(params);
  return response.data;
}

function readPage(data: HttpMessageBody): SearchPage {
  const page: Record<string, unknown> = Array.isArray(data) ? { results: data } : sprinklrErrors.isRecord(data) ? data : {};
  const pageResults = page['results'];
  const results = Array.isArray(pageResults) ? pageResults : [];
  const rawCursor = page['cursor'];
  const cursor = typeof rawCursor === 'string' ? rawCursor.trim().replace(/^id=/, '') : undefined;
  const rawCount = page['count'];
  return {
    results,
    cursor: cursor && cursor.length > 0 ? cursor : undefined,
    count: typeof rawCount === 'number' ? rawCount : undefined,
  };
}

async function search<T = HttpMessageBody>({
  auth,
  entity,
  body,
  maxResults = DEFAULT_MAX_RESULTS,
  sleep,
}: SprinklrSearchRequest): Promise<SprinklrSearchResult<T>> {
  const path = sprinklrEndpoints.search(entity);
  const first = readPage(await request({ auth, method: HttpMethod.POST, path, body, sleep }));
  let results: T[] = first.results;
  let cursor = first.cursor;
  let pages = 1;
  const params = sprinklrEndpoints.SEARCH_CURSOR_PARAMS;
  let paramIndex = 0;
  while (cursor && results.length < maxResults) {
    try {
      const page = readPage(
        await request({ auth, method: HttpMethod.GET, path, query: { [params[paramIndex]]: cursor }, sleep }),
      );
      pages += 1;
      if (page.results.length === 0) {
        break;
      }
      results = [...results, ...page.results];
      cursor = page.cursor;
    } catch (error) {
      if (error instanceof SprinklrApiError && error.status === 400 && paramIndex < params.length - 1) {
        paramIndex += 1;
        continue;
      }
      throw error;
    }
  }
  return {
    results: results.slice(0, maxResults),
    count: first.count,
    pages,
  };
}

async function getMe({ auth, sleep }: { auth: SprinklrAuthValue; sleep?: SprinklrSleep }): Promise<SprinklrUser | undefined> {
  const data = await request({ auth, method: HttpMethod.GET, path: sprinklrEndpoints.ME, sleep });
  const user = Array.isArray(data) ? data[0] : data;
  if (!sprinklrErrors.isRecord(user)) {
    return undefined;
  }
  return {
    id: typeof user['id'] === 'string' || typeof user['id'] === 'number' ? user['id'] : undefined,
    name: typeof user['name'] === 'string' ? user['name'] : undefined,
    email: typeof user['email'] === 'string' ? user['email'] : undefined,
    raw: user,
  };
}

function customApiBaseUrl(auth?: SprinklrAuthValue): string {
  const base = auth?.props?.['base'];
  return typeof base === 'string' && base.trim().length > 0 ? sprinklrEnvironments.customApiBaseUrl(base) : '';
}

async function customApiAuthMapping(auth: SprinklrAuthValue): Promise<Record<string, string>> {
  return authHeaders(auth);
}

export const sprinklrClient = {
  DEFAULT_MAX_RESULTS,
  RATE_LIMIT_DELAYS_MS,
  SERVER_RETRY_DELAYS_MS,
  connectionFrom,
  authHeaders,
  buildUrl,
  unwrap,
  send,
  request,
  search,
  getMe,
  customApiBaseUrl,
  customApiAuthMapping,
};

export { sprinklrTiming };

export type SprinklrAuthValue = {
  access_token: string;
  client_id?: string;
  props?: Record<string, unknown>;
};

export type SprinklrConnection = {
  baseUrl: string;
  apiBaseUrl: string;
  accessToken: string;
  apiKey: string;
};

export type SprinklrQuery = Record<string, string | number | boolean | undefined | null>;

export type SprinklrSleep = (ms: number) => Promise<void>;

export type SprinklrRequest = {
  auth: SprinklrAuthValue;
  method: HttpMethod;
  path: string;
  query?: SprinklrQuery;
  body?: unknown;
  retryOn5xx?: boolean;
  timeoutMs?: number;
  sleep?: SprinklrSleep;
};

export type SprinklrResponse = {
  status: number;
  data: HttpMessageBody;
  raw: HttpMessageBody;
};

export type SprinklrSearchRequest = {
  auth: SprinklrAuthValue;
  entity: SearchEntity;
  body: Record<string, unknown>;
  maxResults?: number;
  sleep?: SprinklrSleep;
};

export type SprinklrSearchResult<T> = {
  results: T[];
  count: number | undefined;
  pages: number;
};

type SearchPage = {
  results: HttpMessageBody[];
  cursor: string | undefined;
  count: number | undefined;
};

export type SprinklrUser = {
  id: string | number | undefined;
  name: string | undefined;
  email: string | undefined;
  raw: Record<string, unknown>;
};
