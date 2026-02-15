import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

const KLAVIYO_API_BASE = 'https://a.klaviyo.com/api';
const KLAVIYO_API_REVISION = '2024-10-15';

export interface KlaviyoApiCall {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
}

export async function klaviyoApiCall<T = unknown>({
  apiKey,
  method,
  path,
  body,
  queryParams,
}: KlaviyoApiCall): Promise<T> {
  const request: HttpRequest = {
    method,
    url: `${KLAVIYO_API_BASE}${path}`,
    headers: {
      Authorization: `Klaviyo-API-Key ${apiKey}`,
      revision: KLAVIYO_API_REVISION,
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json',
    },
    body,
    queryParams,
  };

  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}

export async function klaviyoApiCallPaginated<T = unknown>({
  apiKey,
  path,
  queryParams,
}: {
  apiKey: string;
  path: string;
  queryParams?: Record<string, string>;
}): Promise<T[]> {
  const results: T[] = [];
  let nextPageCursor: string | undefined;

  do {
    const params = { ...queryParams };
    if (nextPageCursor) {
      params['page[cursor]'] = nextPageCursor;
    }

    const response = await klaviyoApiCall<{
      data: T[];
      links?: { next?: string };
    }>({
      apiKey,
      method: HttpMethod.GET,
      path,
      queryParams: params,
    });

    results.push(...response.data);

    // Extract cursor from next link
    nextPageCursor = undefined;
    if (response.links?.next) {
      const url = new URL(response.links.next);
      nextPageCursor = url.searchParams.get('page[cursor]') ?? undefined;
    }
  } while (nextPageCursor);

  return results;
}
