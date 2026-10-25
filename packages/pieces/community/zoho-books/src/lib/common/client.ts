import { HttpHeaders, HttpMethod, QueryParams, httpClient } from '@activepieces/pieces-common';

import type { ZohoBooksAuthValue } from './types';

function baseUrl({ auth }: { auth: ZohoBooksAuthValue }): string {
  const apiDomain = auth.data?.api_domain;
  return apiDomain ? `${apiDomain}/books/v3` : '';
}

function authHeaders({ auth }: { auth: ZohoBooksAuthValue }): HttpHeaders {
  return { Authorization: `Zoho-oauthtoken ${auth.access_token}` };
}

async function request<T>({
  auth,
  method,
  path,
  query,
  body,
  headers,
}: RequestParams & { auth: ZohoBooksAuthValue }): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl({ auth })}${path}`,
    headers: { ...headers, ...authHeaders({ auth }) },
    queryParams: query,
    body,
  });
  return response.body;
}

export const zohoBooksClient = { baseUrl, authHeaders, request };

type RequestParams = {
  method: HttpMethod;
  path: string;
  query?: QueryParams;
  body?: unknown;
  headers?: HttpHeaders;
};
