import { ScrapelessClient } from '@scrapeless-ai/sdk';

import {
  httpClient,
  HttpHeaders,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';

import type { ScrapelessAuthValue } from './types';

function baseUrl(): string {
  return `${HOST}/api/v1`;
}

function create({ auth }: { auth: ScrapelessAuthValue }): ScrapelessClient {
  return new ScrapelessClient({
    apiKey: auth.secret_text,
    timeout: 2 * 60 * 1000,
  });
}

async function send<T>({
  auth,
  method,
  path,
  query,
  body,
  headers,
}: RequestParams & { auth: ScrapelessAuthValue }): Promise<{
  status: number;
  body: T;
}> {
  const response = await httpClient.sendRequest<T>({
    url: `${HOST}${path}`,
    method,
    headers: {
      ...headers,
      'x-api-token': auth.secret_text,
    },
    queryParams: query,
    body,
    timeout: TIMEOUT_MS,
  });
  return { status: response.status, body: response.body };
}

async function request<T>(
  params: RequestParams & { auth: ScrapelessAuthValue }
): Promise<T> {
  const response = await send<T>(params);
  return response.body;
}

export const scrapelessClient = { baseUrl, create, request, send };

const HOST = 'https://api.scrapeless.com';
const TIMEOUT_MS = 2 * 60 * 1000;

type RequestParams = {
  method: HttpMethod;
  path: string;
  query?: QueryParams;
  body?: unknown;
  headers?: HttpHeaders;
};
