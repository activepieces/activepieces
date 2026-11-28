import { AuthenticationType, HttpHeaders, HttpMethod, QueryParams, httpClient } from '@activepieces/pieces-common';
import type { BoxAuthValue } from './types';

function baseUrl(): string {
  return 'https://api.box.com/2.0';
}

async function request<T>({ auth, method, path, query, body, headers }: RequestParams & { auth: BoxAuthValue }): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl()}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
    queryParams: definedQuery({ query }),
    headers,
    body,
  });
  return response.body;
}

async function download({ auth, path, query, host = baseUrl() }: DownloadParams & { auth: BoxAuthValue }): Promise<BoxDownload> {
  const response = await httpClient.sendRequest<ArrayBuffer>({
    method: HttpMethod.GET,
    url: `${host}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
    queryParams: definedQuery({ query }),
    responseType: 'arraybuffer',
    followRedirects: true,
  });
  return {
    data: Buffer.from(response.body),
    contentType: headerValue({ headers: response.headers, name: 'content-type' }),
  };
}

async function requestText({ auth, method, path, query }: RequestParams & { auth: BoxAuthValue }): Promise<string> {
  const response = await httpClient.sendRequest<string>({
    method,
    url: `${baseUrl()}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
    queryParams: definedQuery({ query }),
    responseType: 'text',
  });
  return response.body;
}

async function uploadForm<T>({ auth, path, form }: { auth: BoxAuthValue; path: string; form: FormData }): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.POST,
    url: `${baseUrl()}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
    body: form,
  });
  return response.body;
}

async function upload<T>({ auth, path, attributes, file, fileName, headers }: UploadParams & { auth: BoxAuthValue }): Promise<T> {
  const form = new FormData();
  form.append('attributes', JSON.stringify(attributes));
  form.append('file', new Blob([file]), fileName);
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.POST,
    url: `${UPLOAD_BASE_URL}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
    headers,
    body: form,
  });
  return response.body;
}

function definedQuery({ query }: { query?: BoxQuery }): QueryParams | undefined {
  if (query === undefined) {
    return undefined;
  }
  return Object.fromEntries(
    Object.entries(query).flatMap(([key, value]) => (value === undefined ? [] : [[key, value]])),
  );
}

function headerValue({ headers, name }: { headers?: HttpHeaders; name: string }): string | undefined {
  const value = headers?.[name];
  return Array.isArray(value) ? value[0] : value;
}

export const boxClient = { baseUrl, request, requestText, download, upload, uploadForm };

const UPLOAD_BASE_URL = 'https://upload.box.com/api/2.0';

type BoxQuery = Record<string, string | undefined>;

type RequestParams = {
  method: HttpMethod;
  path: string;
  query?: BoxQuery;
  body?: Record<string, unknown> | unknown[];
  headers?: HttpHeaders;
};

type DownloadParams = { path: string; query?: BoxQuery; host?: string };

type UploadParams = {
  path: string;
  attributes: Record<string, unknown>;
  file: Buffer;
  fileName: string;
  headers?: HttpHeaders;
};

type BoxDownload = { data: Buffer; contentType?: string };
