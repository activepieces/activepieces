import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
  QueryParams,
} from '@activepieces/pieces-common';
import { getQawafelBaseUrl, QawafelAuth } from './auth';

export async function qawafelApiCall<T extends HttpMessageBody>({
  auth,
  method,
  path,
  body,
  queryParams,
  idempotencyKey,
}: {
  auth: QawafelAuth;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: QueryParams;
  idempotencyKey?: string;
}): Promise<HttpResponse<T>> {
  const headers: Record<string, string> = {
    'x-qawafel-api-key': auth.props.apiKey,
  };
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }
  return await httpClient.sendRequest<T>({
    method,
    url: `${getQawafelBaseUrl(auth)}${path}`,
    headers,
    queryParams,
    body,
  });
}

export async function qawafelPaginatedList<T>({
  auth,
  path,
  queryParams,
  pageSize = 100,
  maxPages = 5,
}: {
  auth: QawafelAuth;
  path: string;
  queryParams?: QueryParams;
  pageSize?: number;
  maxPages?: number;
}): Promise<T[]> {
  const results: T[] = [];
  let cursor: string | null = null;
  let pages = 0;
  while (pages < maxPages) {
    const params: QueryParams = {
      ...(queryParams ?? {}),
      limit: String(pageSize),
    };
    if (cursor) {
      params['after'] = cursor;
    }
    const response = await qawafelApiCall<QawafelPaginatedResponse<T>>({
      auth,
      method: HttpMethod.GET,
      path,
      queryParams: params,
    });
    results.push(...response.body.data);
    cursor = response.body.pagination?.next_cursor ?? null;
    if (!cursor) break;
    pages += 1;
  }
  return results;
}

export type QawafelPaginatedResponse<T> = {
  data: T[];
  pagination: {
    next_cursor: string | null;
  };
};
