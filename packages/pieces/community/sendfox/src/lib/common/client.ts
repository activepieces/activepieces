import {
  AuthenticationType,
  HttpMethod,
  httpClient,
  QueryParams,
} from '@activepieces/pieces-common';
import type { SendfoxAuthValue, SendfoxPage } from './types';

function baseUrl(): string {
  return 'https://api.sendfox.com';
}

async function request<T>({
  auth,
  method,
  path,
  query,
  body,
}: RequestParams & { auth: SendfoxAuthValue }): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl()}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.secret_text,
    },
    queryParams: query,
    body,
  });
  return response.body;
}

async function paginate<T>({
  auth,
  path,
  query,
  maxPages = MAX_PAGES,
}: PaginateParams & { auth: SendfoxAuthValue }): Promise<T[]> {
  const items: T[] = [];
  let lastPage = 1;
  for (let page = 1; page <= lastPage && page <= maxPages; page++) {
    const response = await request<SendfoxPage<T>>({
      auth,
      method: HttpMethod.GET,
      path,
      query: { ...query, page: String(page) },
    });
    lastPage = response.last_page;
    items.push(...response.data);
  }
  return items;
}

export const sendfoxClient = { baseUrl, request, paginate };

const MAX_PAGES = 100;

type RequestParams = {
  method: HttpMethod;
  path: string;
  query?: QueryParams;
  body?: unknown;
};
type PaginateParams = { path: string; query?: QueryParams; maxPages?: number };
