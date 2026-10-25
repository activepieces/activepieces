import { HttpHeaders, HttpMethod, QueryParams, httpClient } from '@activepieces/pieces-common';

import type { ZohoBooksAuthValue, ZohoBooksDownload, ZohoBooksQuery } from './types';

function baseUrl({ auth }: { auth: ZohoBooksAuthValue }): string {
  const apiDomain = auth.data?.api_domain;
  return apiDomain ? `${apiDomain}/books/v3` : '';
}

function authHeaders({ auth }: { auth: ZohoBooksAuthValue }): HttpHeaders {
  return { Authorization: `Zoho-oauthtoken ${auth.access_token}` };
}

function toQueryParams({ query }: { query?: ZohoBooksQuery }): QueryParams {
  return Object.fromEntries(
    Object.entries(query ?? {})
      .filter((entry): entry is [string, string | number | boolean] => entry[1] !== undefined)
      .map(([key, value]) => [key, String(value)]),
  );
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
    queryParams: toQueryParams({ query }),
    body,
  });
  return response.body;
}

async function download({
  auth,
  path,
  query,
}: DownloadParams & { auth: ZohoBooksAuthValue }): Promise<ZohoBooksDownload> {
  const response = await httpClient.sendRequest<ArrayBuffer>({
    method: HttpMethod.GET,
    url: `${baseUrl({ auth })}${path}`,
    headers: authHeaders({ auth }),
    queryParams: toQueryParams({ query }),
    responseType: 'arraybuffer',
  });
  const contentType = response.headers?.['content-type'];
  const disposition = response.headers?.['content-disposition'];
  const fileName =
    typeof disposition === 'string'
      ? /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)?.[1]
      : undefined;
  return {
    data: Buffer.from(response.body),
    contentType: typeof contentType === 'string' ? contentType : undefined,
    fileName: fileName ? decodeURIComponent(fileName) : undefined,
  };
}

export const zohoBooksClient = { baseUrl, authHeaders, request, download };

type RequestParams = {
  method: HttpMethod;
  path: string;
  query?: ZohoBooksQuery;
  body?: unknown;
  headers?: HttpHeaders;
};

type DownloadParams = {
  path: string;
  query?: ZohoBooksQuery;
};
