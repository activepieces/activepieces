import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
  QueryParams,
} from '@activepieces/pieces-common';
import { WAFEQ_API_BASE_URL } from './auth';

export async function wafeqApiCall<T extends HttpMessageBody>({
  apiKey,
  method,
  path,
  body,
  queryParams,
  idempotencyKey,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: QueryParams;
  idempotencyKey?: string;
}): Promise<HttpResponse<T>> {
  const headers: Record<string, string> = {
    Authorization: `Api-Key ${apiKey}`,
  };
  if (idempotencyKey) {
    headers['X-Wafeq-Idempotency-Key'] = idempotencyKey;
  }
  return await httpClient.sendRequest<T>({
    method,
    url: `${WAFEQ_API_BASE_URL}${path}`,
    headers,
    queryParams,
    body,
  });
}

export async function wafeqPaginatedList<T>({
  apiKey,
  path,
  queryParams,
  pageSize = 100,
  maxPages = 5,
}: {
  apiKey: string;
  path: string;
  queryParams?: QueryParams;
  pageSize?: number;
  maxPages?: number;
}): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  while (page <= maxPages) {
    const response = await wafeqApiCall<WafeqPaginatedResponse<T>>({
      apiKey,
      method: HttpMethod.GET,
      path,
      queryParams: {
        ...(queryParams ?? {}),
        page: String(page),
        page_size: String(pageSize),
      },
    });
    results.push(...response.body.results);
    if (!response.body.next) break;
    page += 1;
  }
  return results;
}

export type WafeqPaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
