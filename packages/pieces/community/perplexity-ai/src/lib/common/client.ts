import {
  AuthenticationType,
  HttpMethod,
  httpClient,
  QueryParams,
} from '@activepieces/pieces-common';
import FormData from 'form-data';
import type { PerplexityAiAuthValue } from './types';

function baseUrl(): string {
  return 'https://api.perplexity.ai';
}

async function request<T>({
  auth,
  method,
  path,
  query,
  body,
  headers,
}: RequestParams & { auth: PerplexityAiAuthValue }): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl()}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.secret_text,
    },
    headers: { 'Content-Type': 'application/json', ...headers },
    queryParams: query,
    body,
  });
  return response.body;
}

async function upload<T>({
  auth,
  method,
  path,
  query,
  form,
}: UploadParams & { auth: PerplexityAiAuthValue }): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl()}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.secret_text,
    },
    headers: form.getHeaders(),
    queryParams: query,
    body: form,
  });
  return response.body;
}

async function download({
  auth,
  path,
}: DownloadParams & { auth: PerplexityAiAuthValue }): Promise<Buffer> {
  const response = await httpClient.sendRequest<ArrayBuffer>({
    method: HttpMethod.GET,
    url: `${baseUrl()}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.secret_text,
    },
    responseType: 'arraybuffer',
  });
  return Buffer.from(response.body);
}

export const perplexityAiClient = { baseUrl, request, upload, download };

type RequestParams = {
  method: HttpMethod;
  path: string;
  query?: QueryParams;
  body?: unknown;
  headers?: Record<string, string>;
};

type UploadParams = {
  method: HttpMethod;
  path: string;
  query?: QueryParams;
  form: FormData;
};

type DownloadParams = { path: string };
