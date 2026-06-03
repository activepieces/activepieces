import {
  AuthenticationType,
  httpClient,
  HttpMessageBody,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';
import { AddEventPage } from './types';

const BASE_URL = 'https://api.addevent.com/calevent/v2';
const MAX_PAGE_SIZE = 20;

async function apiCall<T extends HttpMessageBody>({
  apiKey,
  method,
  resourceUri,
  query,
  body,
}: AddEventApiCallParams): Promise<T> {
  const queryParams: QueryParams = {};
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        queryParams[key] = Array.isArray(value)
          ? value.join(',')
          : String(value);
      }
    }
  }

  const request: HttpRequest = {
    method,
    url: `${BASE_URL}${resourceUri}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: apiKey,
    },
    queryParams,
    body,
  };

  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}

async function getAllPages<T extends HttpMessageBody>({
  apiKey,
  resourceUri,
  select,
  query,
  maxPages,
}: {
  apiKey: string;
  resourceUri: string;
  select: (page: AddEventPage) => T[];
  query?: AddEventQuery;
  maxPages?: number;
}): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await apiCall<AddEventPage>({
      apiKey,
      method: HttpMethod.GET,
      resourceUri,
      query: { ...query, page, page_size: MAX_PAGE_SIZE },
    });
    results.push(...select(response));
    totalPages = response.pagination.total_pages;
    page += 1;
  } while (page <= totalPages && (maxPages === undefined || page <= maxPages));

  return results;
}

export const addEventApi = {
  baseUrl: BASE_URL,
  maxPageSize: MAX_PAGE_SIZE,
  call: apiCall,
  getAllPages,
};

export type AddEventQuery = Record<
  string,
  string | number | boolean | string[] | undefined | null
>;

export type AddEventApiCallParams = {
  apiKey: string;
  method: HttpMethod;
  resourceUri: string;
  query?: AddEventQuery;
  body?: unknown;
};
