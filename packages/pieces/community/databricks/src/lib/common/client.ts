import {
  AuthenticationType,
  HttpMethod,
  httpClient,
  QueryParams,
} from '@activepieces/pieces-common';

import type {
  DatabricksAuthValue,
  DatabricksCredentials,
  DatabricksPage,
  DatabricksToken,
} from './types';

function baseUrl({ auth }: { auth: DatabricksAuthValue }): string {
  return normalizeWorkspaceUrl({ workspaceUrl: auth.props.workspaceUrl });
}

function normalizeWorkspaceUrl({
  workspaceUrl,
}: {
  workspaceUrl: string;
}): string {
  const url = workspaceUrl.trim().replace(/\/+$/, '');
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

async function fetchToken({
  credentials,
}: {
  credentials: DatabricksCredentials;
}): Promise<DatabricksToken> {
  const response = await httpClient.sendRequest<DatabricksToken>({
    method: HttpMethod.POST,
    url: `${normalizeWorkspaceUrl({
      workspaceUrl: credentials.workspaceUrl,
    })}/oidc/v1/token`,
    authentication: {
      type: AuthenticationType.BASIC,
      username: credentials.clientId,
      password: credentials.clientSecret,
    },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials&scope=all-apis',
  });
  return response.body;
}

async function request<T>({
  auth,
  method,
  path,
  query,
  body,
  headers,
}: RequestParams & { auth: DatabricksAuthValue }): Promise<T> {
  const token =
    auth.access_token ??
    (await fetchToken({ credentials: auth.props })).access_token;
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl({ auth })}${path}`,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token },
    queryParams: query,
    headers,
    body,
  });
  return response.body;
}

async function paginate<K extends string, T>({
  auth,
  path,
  query,
  itemsKey,
  maxItems = MAX_ITEMS,
}: PaginateParams<K> & { auth: DatabricksAuthValue }): Promise<T[]> {
  const items: T[] = [];
  let pageToken: string | undefined;
  do {
    const page = await request<DatabricksPage<K, T>>({
      auth,
      method: HttpMethod.GET,
      path,
      query: { ...query, ...(pageToken ? { page_token: pageToken } : {}) },
    });
    items.push(...(page[itemsKey] ?? []));
    pageToken = page.next_page_token;
  } while (pageToken && items.length < maxItems);
  return items.slice(0, maxItems);
}

export const databricksClient = { baseUrl, fetchToken, request, paginate };

const MAX_ITEMS = 1000;

type RequestParams = {
  method: HttpMethod;
  path: string;
  query?: QueryParams;
  body?: unknown;
  headers?: Record<string, string>;
};

type PaginateParams<K extends string> = {
  path: string;
  query?: QueryParams;
  itemsKey: K;
  maxItems?: number;
};
