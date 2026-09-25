import {
  AuthenticationType,
  httpClient,
  HttpError,
  HttpMethod,
  HttpResponse,
  QueryParams,
} from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { wordpressAuth } from '../..';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readErrorBody(body: unknown): {
  code: string;
  message: string;
  data: Record<string, unknown>;
} {
  if (isRecord(body)) {
    return {
      code: typeof body['code'] === 'string' ? body['code'] : 'unknown_error',
      message:
        typeof body['message'] === 'string' ? body['message'] : JSON.stringify(body),
      data: isRecord(body['data']) ? body['data'] : {},
    };
  }
  return {
    code: 'non_json_response',
    message: typeof body === 'string' ? body.slice(0, 200) : String(body),
    data: {},
  };
}

function unreachableMessage({ url }: { url: string }): string {
  return `WordPress did not return REST API JSON from ${url}. The REST API is not reachable at /wp-json: set Settings > Permalinks to any option other than "Plain", check the Website URL, and check that no security plugin blocks the REST API.`;
}

function describeError({
  status,
  code,
  message,
  data,
  path,
}: {
  status: number;
  code: string;
  message: string;
  data: Record<string, unknown>;
  path: string;
}): string {
  const suffix = ` [HTTP ${status}, code ${code}]`;
  switch (code) {
    case 'rest_no_route':
      return `The WordPress REST route ${path} was not found. Set Settings > Permalinks to any option other than "Plain" and check that no security plugin blocks /wp-json.${suffix}`;
    case 'rest_post_invalid_page_number':
      return `The requested page is past the last page of results. Use a lower page number; list outputs report total_pages.${suffix}`;
    case 'rest_already_trashed':
      return `The item is already in the trash.${suffix}`;
    case 'rest_trash_not_supported':
    case 'rest_trash_not_implemented':
      return `This item cannot be moved to the trash on this site. Use the permanent delete action instead.${suffix}`;
    case 'rest_comment_closed':
      return `Comments are closed on this post.${suffix}`;
    case 'rest_comment_draft_post':
      return `Comments can only be added to a published post.${suffix}`;
    case 'rest_comment_failed_edit':
      return `WordPress could not change the comment status.${suffix}`;
    case 'duplicate_term_slug':
      return `Another term already uses this slug. Use a different slug or omit it.${suffix}`;
    case 'term_exists':
      return `A term with this name already exists under the same parent (term ID ${String(data['term_id'])}).${suffix}`;
  }
  if (status === 401) {
    return `WordPress rejected the credentials: ${message} Check the username and use an Application Password (Users > Profile > Application Passwords).${suffix}`;
  }
  if (status === 403) {
    return `The connected WordPress user's role is not allowed to do this: ${message}${suffix}`;
  }
  if (status === 404) {
    return `WordPress could not find the requested item: ${message} Check the ID.${suffix}`;
  }
  if (status === 429) {
    return `The WordPress host is rate limiting requests. Wait and retry.${suffix}`;
  }
  const params = isRecord(data['params']) ? ` ${JSON.stringify(data['params'])}` : '';
  return `WordPress returned an error: ${message}${params}${suffix}`;
}

function siteBaseUrl({ auth }: { auth: WordpressAuthValue }): string {
  return `${auth.props.website_url.trim().replace(/\/+$/, '')}/wp-json/wp/v2`;
}

async function request<T>({
  auth,
  method,
  path,
  queryParams,
  body,
}: WordpressRequestParams): Promise<HttpResponse<T>> {
  const url = `${siteBaseUrl({ auth })}${path}`;
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url,
      queryParams,
      body,
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth.props.username,
        password: auth.props.password,
      },
    });
    if (typeof response.body === 'string' || response.body === undefined) {
      throw new WordpressApiError({
        status: response.status,
        code: 'non_json_response',
        data: {},
        message: `${unreachableMessage({ url })} [HTTP ${response.status}, code non_json_response]`,
      });
    }
    return response;
  } catch (error) {
    if (error instanceof HttpError) {
      const status = error.response.status;
      const { code, message, data } = readErrorBody(error.response.body);
      throw new WordpressApiError({
        status,
        code,
        data,
        message:
          code === 'non_json_response'
            ? `${unreachableMessage({ url })} [HTTP ${status}, code ${code}]`
            : describeError({ status, code, message, data, path }),
      });
    }
    throw error;
  }
}

function readCountHeader({
  headers,
  name,
}: {
  headers: HttpResponse['headers'];
  name: string;
}): number | undefined {
  const raw = headers?.[name];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === undefined || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function list<T>({
  auth,
  path,
  queryParams,
}: {
  auth: WordpressAuthValue;
  path: string;
  queryParams: QueryParams;
}): Promise<WordpressListResult<T>> {
  const response = await request<T[]>({
    auth,
    method: HttpMethod.GET,
    path,
    queryParams,
  });
  const items = Array.isArray(response.body) ? response.body : [];
  return {
    items,
    total: readCountHeader({ headers: response.headers, name: 'x-wp-total' }),
    total_pages: readCountHeader({
      headers: response.headers,
      name: 'x-wp-totalpages',
    }),
  };
}

async function trashItem({
  auth,
  collection,
  id,
}: {
  auth: WordpressAuthValue;
  collection: 'posts' | 'pages';
  id: number;
}): Promise<WordpressRecord> {
  try {
    const response = await request<WordpressRecord>({
      auth,
      method: HttpMethod.DELETE,
      path: `/${collection}/${id}`,
    });
    return response.body;
  } catch (error) {
    if (error instanceof WordpressApiError && error.code === 'rest_already_trashed') {
      const current = await request<WordpressRecord>({
        auth,
        method: HttpMethod.GET,
        path: `/${collection}/${id}`,
        queryParams: { context: 'edit' },
      });
      return current.body;
    }
    throw error;
  }
}

async function getOrCreateTerm({
  auth,
  taxonomy,
  body,
}: {
  auth: WordpressAuthValue;
  taxonomy: 'categories' | 'tags';
  body: Record<string, unknown>;
}): Promise<WordpressRecord> {
  try {
    const response = await request<WordpressRecord>({
      auth,
      method: HttpMethod.POST,
      path: `/${taxonomy}`,
      body,
    });
    return { ...response.body, created: true };
  } catch (error) {
    if (error instanceof WordpressApiError && error.code === 'term_exists') {
      const termId = error.data['term_id'];
      if (typeof termId !== 'number' && typeof termId !== 'string') {
        throw error;
      }
      const existing = await request<WordpressRecord>({
        auth,
        method: HttpMethod.GET,
        path: `/${taxonomy}/${termId}`,
      });
      return { ...existing.body, created: false };
    }
    throw error;
  }
}

async function forceDelete({
  auth,
  path,
}: {
  auth: WordpressAuthValue;
  path: string;
}): Promise<WordpressRecord> {
  const response = await request<WordpressRecord>({
    auth,
    method: HttpMethod.DELETE,
    path,
    queryParams: { force: 'true' },
  });
  return response.body;
}

export class WordpressApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly data: Record<string, unknown>;

  constructor({
    status,
    code,
    data,
    message,
  }: {
    status: number;
    code: string;
    data: Record<string, unknown>;
    message: string;
  }) {
    super(message);
    this.name = 'WordpressApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

export const wordpressApi = { request, list, trashItem, getOrCreateTerm, forceDelete };

export type WordpressAuthValue = AppConnectionValueForAuthProperty<
  typeof wordpressAuth
>;

export type WordpressRequestParams = {
  auth: WordpressAuthValue;
  method: HttpMethod;
  path: string;
  queryParams?: QueryParams;
  body?: unknown;
};

export type WordpressListResult<T> = {
  items: T[];
  total: number | undefined;
  total_pages: number | undefined;
};

export type WordpressRecord = Record<string, unknown>;
