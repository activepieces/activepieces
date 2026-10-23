import { ScrapelessClient } from '@scrapeless-ai/sdk';

import { httpClient, HttpMethod } from '@activepieces/pieces-common';

import type { ScrapelessAuthValue } from './types';

function baseUrl(): string {
  return 'https://api.scrapeless.com/api/v1';
}

function create({ auth }: { auth: ScrapelessAuthValue }): ScrapelessClient {
  return new ScrapelessClient({
    apiKey: auth.secret_text,
    timeout: 2 * 60 * 1000,
  });
}

async function request<T>({
  auth,
  method,
  path,
}: RequestParams & { auth: ScrapelessAuthValue }): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    url: `${baseUrl()}${path}`,
    method,
    headers: {
      'x-api-token': auth.secret_text,
    },
  });
  return response.body;
}

export const scrapelessClient = { baseUrl, create, request };

type RequestParams = { method: HttpMethod; path: string };
