import { httpClient, HttpError, HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { AppConnectionType, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { REVIEWFLOWZ_API_BASE, REVIEWFLOWZ_USER_AGENT } from './constants';
import { ReviewflowzPage, ReviewflowzProblem } from './types';

async function send<T>({
  auth,
  method,
  path,
  body,
  query,
  headers,
}: RequestParams): Promise<ReviewflowzResponse<T>> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${REVIEWFLOWZ_API_BASE}${path.startsWith('/') ? path : `/${path}`}`,
      headers: {
        Authorization: `Bearer ${tokenOf(auth)}`,
        Accept: 'application/json',
        'User-Agent': REVIEWFLOWZ_USER_AGENT,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(headers ?? {}),
      },
      body,
      queryParams: cleanQuery(query),
    });
    return { ok: true, status: response.status, body: response.body };
  } catch (error) {
    if (error instanceof HttpError) {
      return { ok: false, status: error.response.status, body: error.response.body };
    }
    throw error;
  }
}

async function call<T>(params: RequestParams): Promise<T> {
  const response = await send<T>(params);
  if (!response.ok) {
    throw new Error(errorMessage({ status: response.status, body: response.body }));
  }
  return response.body;
}

async function listAll<T>({
  auth,
  path,
  query,
  max = 500,
}: {
  auth: ReviewflowzAuthValue;
  path: string;
  query?: Record<string, QueryValue>;
  max?: number;
}): Promise<T[]> {
  const rows: T[] = [];
  let cursor: string | null | undefined;
  do {
    const page: ReviewflowzPage<T> = await call<ReviewflowzPage<T>>({
      auth,
      method: HttpMethod.GET,
      path,
      query: { limit: 100, ...(query ?? {}), ...(cursor ? { cursor } : {}) },
    });
    rows.push(...(page.data ?? []));
    cursor = page.has_more ? page.next_cursor : null;
  } while (cursor && rows.length < max);
  return rows.slice(0, max);
}

function errorMessage({ status, body }: { status: number; body: unknown }): string {
  const problem = isProblem(body) ? body : undefined;
  const detail = problem?.detail || problem?.title || `Reviewflowz answered ${status}.`;
  const fields = (problem?.errors ?? [])
    .map((error) => (error.field ? `${error.field}: ${error.detail}` : error.detail))
    .filter((line): line is string => Boolean(line));
  const message = fields.length === 0 || fields.some((line) => detail.includes(line)) ? detail : `${detail} ${fields.join(' ')}`;
  if (status === 401) {
    return `Your Reviewflowz connection expired or was revoked. Reconnect Reviewflowz in Activepieces. (${message})`;
  }
  if (status === 429) {
    return `Reviewflowz is getting too many requests from this connection. Wait a minute and try again. (${message})`;
  }
  if (status >= 500) {
    return `Reviewflowz had a problem (${status}). Try again in a few minutes. ${message}`;
  }
  return message;
}

function tokenOf(auth: ReviewflowzAuthValue): string {
  return auth.type === AppConnectionType.SECRET_TEXT ? auth.secret_text : auth.access_token;
}

function cleanQuery(query?: Record<string, QueryValue>): QueryParams {
  return Object.fromEntries(
    Object.entries(query ?? {})
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, String(value)]),
  );
}

function isProblem(body: unknown): body is ReviewflowzProblem {
  return typeof body === 'object' && body !== null && !Array.isArray(body);
}

export const reviewflowzApi = { send, call, listAll, errorMessage };

export type ReviewflowzAuthValue = AppConnectionValueForAuthProperty<typeof reviewflowzAuth>;

type QueryValue = string | number | boolean | undefined | null;

type RequestParams = {
  auth: ReviewflowzAuthValue;
  method: HttpMethod;
  path: string;
  body?: unknown;
  query?: Record<string, QueryValue>;
  headers?: Record<string, string>;
};

type ReviewflowzResponse<T> =
  | { ok: true; status: number; body: T }
  | { ok: false; status: number; body: unknown };
