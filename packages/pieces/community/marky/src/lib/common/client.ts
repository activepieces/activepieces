import {
  AuthenticationType,
  HttpMessageBody,
  HttpMethod,
  HttpResponse,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';

async function apiCall<T extends HttpMessageBody>({
  apiKey,
  method,
  path,
  body,
  queryParams,
  headers,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: QueryParams;
  headers?: Record<string, string>;
}): Promise<HttpResponse<T>> {
  return httpClient.sendRequest<T>({
    method,
    url: `${MARKY_BASE_URL}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: apiKey,
    },
    headers: {
      'Marky-Version': MARKY_API_VERSION,
      ...headers,
    },
    queryParams,
    body,
  });
}

async function fetchAllPages<T>({
  apiKey,
  path,
}: {
  apiKey: string;
  path: string;
}): Promise<T[]> {
  const collected: T[][] = [];
  let cursor: string | null = null;

  for (let page = 0; page < MAX_PAGES_TO_FETCH; page++) {
    const queryParams: QueryParams = { limit: String(MAX_PAGE_SIZE) };
    if (cursor !== null) {
      queryParams['cursor'] = cursor;
    }

    const response: HttpResponse<MarkyPage<T>> = await apiCall<MarkyPage<T>>({
      apiKey,
      method: HttpMethod.GET,
      path,
      queryParams,
    });

    collected.push(response.body.items);
    cursor = response.body.next;

    if (cursor === null || cursor === undefined) {
      break;
    }
  }

  return collected.flat();
}

const MAX_PAGE_SIZE = 100;
const MAX_PAGES_TO_FETCH = 20;

export const MARKY_BASE_URL = 'https://api.mymarky.ai/api';
export const MARKY_API_VERSION = '2026-08-06';

export const markyCommon = { apiCall, fetchAllPages };

export type MarkyPage<T> = {
  items: T[];
  next: string | null;
};

export type MarkyBusiness = {
  id: string;
  name: string | null;
};

export type MarkyTopic = {
  id: string;
  title: string;
};

export type MarkyWebhook = {
  id: string;
};
