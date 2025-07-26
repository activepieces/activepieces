import {
  AuthenticationType,
  httpClient,
  HttpMessageBody,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const BASE_URL = 'https://api.podio.com';

export type PodioApiCallParams = {
  auth: OAuth2PropertyValue;
  method: HttpMethod;
  resourceUri: string;
  query?: Record<string, string | number | string[] | undefined>;
  body?: any;
};

export async function podioApiCall<T extends HttpMessageBody>({
  auth,
  method,
  resourceUri,
  query,
  body,
}: PodioApiCallParams): Promise<T> {
  const qs: QueryParams = {};

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        qs[key] = String(value);
      }
    }
  }

  const request: HttpRequest = {
    method,
    url: BASE_URL + resourceUri,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
    queryParams: qs,
    body,
  };

  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}

export async function podioPaginatedApiCall<T extends HttpMessageBody>({
  auth,
  method,
  resourceUri,
  query,
  body,
}: PodioApiCallParams): Promise<T[]> {
  const limit = 100;
  let offset = 0;

  const resultData: T[] = [];
  let hasMoreItems = true;

  do {
    const qs = {
      ...(query || {}),
      limit,
      offset,
    };

    const response = await podioApiCall<T[]>({
      auth,
      method,
      resourceUri,
      query: qs,
      body,
    });

    if (!response || (Array.isArray(response) && response.length === 0)) {
      break;
    }

    const items = Array.isArray(response) ? response : [response];
    resultData.push(...items);

    // If fewer than 'limit' items returned, we've reached the last page
    hasMoreItems = items.length === limit;
    offset += limit;
  } while (hasMoreItems);

  return resultData;
}