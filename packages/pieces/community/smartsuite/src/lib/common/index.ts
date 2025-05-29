import {
  httpClient,
  HttpMessageBody,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';
import { SMARTSUITE_API_URL } from './constants';
import { isNil } from '@activepieces/shared';

export type SmartSuiteApiCallParams = {
  apiKey: string;
  accountId: string;
  method: HttpMethod;
  resourceUri: string;
  query?: Record<string, string | number | string[] | undefined>;
  body?: any;
};

export type PaginatedResponse<T> = {
  results: T[];
  count: number;
  next?: string;
  previous?: string;
};

export type TableStucture = {
  slug: string;
  label: string;
  field_type: string;
  params: {
    is_auto_generated: boolean;
    system: boolean;
    choices?: { label: string; value: string }[];
  };
};

export async function smartSuiteApiCall<T extends HttpMessageBody>({
  apiKey,
  accountId,
  method,
  resourceUri,
  query,
  body,
}: SmartSuiteApiCallParams): Promise<T> {
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
    url: SMARTSUITE_API_URL + resourceUri,
    headers: {
      Authorization: `Token ${apiKey}`,
      'ACCOUNT-ID': accountId,
    },
    queryParams: qs,
    body,
  };

  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}

export async function smartSuitePaginatedApiCall<T extends HttpMessageBody>({
  apiKey,
  accountId,
  method,
  resourceUri,
  query,
  body,
}: SmartSuiteApiCallParams): Promise<T[]> {
  const qs = { ...(query || {}), limit: 100, offset: 0 };

  const resultData: T[] = [];
  let hasMore = true;

  do {
    const response = await smartSuiteApiCall<PaginatedResponse<T>>({
      accountId,
      apiKey,
      method,
      resourceUri,
      query: qs,
      body,
    });

    const items = response.results || [];
    resultData.push(...items);

    hasMore = !!response.next && items.length > 0;
    if (hasMore) {
      qs.offset = Number(qs.offset) + Number(qs.limit);
    }
  } while (hasMore);

  return resultData;
}
