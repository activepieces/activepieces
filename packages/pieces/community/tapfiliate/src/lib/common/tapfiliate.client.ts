import {
  HttpMessageBody,
  HttpMethod,
  HttpRequest,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';

export const TAPFILIATE_BASE_URL = 'https://api.tapfiliate.com/1.6';

function shouldKeepValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return true;
}

export function buildTapfiliateQuery(
  values?: Record<string, unknown>
): QueryParams {
  const query: QueryParams = {};

  if (!values) {
    return query;
  }

  for (const [key, value] of Object.entries(values)) {
    if (!shouldKeepValue(value)) {
      continue;
    }

    query[key] = String(value);
  }

  return query;
}

type TapfiliateApiCallParams = {
  method: HttpMethod;
  path: string;
  apiKey: string;
  apiBaseUrl?: string;
  query?: QueryParams;
  body?: unknown;
};

function buildTapfiliateRequest({
  method,
  path,
  apiKey,
  apiBaseUrl = TAPFILIATE_BASE_URL,
  query,
  body,
}: TapfiliateApiCallParams): HttpRequest {
  return {
    method,
    url: `${apiBaseUrl}${path}`,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
    queryParams: query,
    body,
  };
}

export function parseTapfiliateNextPage(
  linkHeader: string | string[] | undefined
): string | undefined {
  const normalizedHeader = Array.isArray(linkHeader)
    ? linkHeader.join(',')
    : linkHeader;

  if (!normalizedHeader || !normalizedHeader.includes('rel="next"')) {
    return undefined;
  }

  const nextLink = normalizedHeader
    .split(',')
    .find((segment) => segment.includes('rel="next"'))
    ?.match(/<(.*?)>/)?.[1];

  if (!nextLink) {
    return undefined;
  }

  return new URL(nextLink).searchParams.get('page') ?? undefined;
}

export async function tapfiliateApiCall<T extends HttpMessageBody>({
  method,
  path,
  apiKey,
  apiBaseUrl = TAPFILIATE_BASE_URL,
  query,
  body,
}: TapfiliateApiCallParams): Promise<T> {
  const response = await httpClient.sendRequest<T>(
    buildTapfiliateRequest({
      method,
      path,
      apiKey,
      apiBaseUrl,
      query,
      body,
    })
  );

  return response.body;
}

export async function tapfiliatePaginatedApiCall<T extends HttpMessageBody>({
  method,
  path,
  apiKey,
  apiBaseUrl = TAPFILIATE_BASE_URL,
  query,
  body,
}: TapfiliateApiCallParams): Promise<T[]> {
  const results: T[] = [];
  let currentQuery = query;
  let pageCount = 0;

  while (pageCount < TAPFILIATE_MAX_PAGES) {
    const response = await httpClient.sendRequest<T[]>(
      buildTapfiliateRequest({
        method,
        path,
        apiKey,
        apiBaseUrl,
        query: currentQuery,
        body,
      })
    );

    if (!Array.isArray(response.body) || response.body.length === 0) {
      return results;
    }

    results.push(...response.body);
    pageCount += 1;

    const nextPage = parseTapfiliateNextPage(
      response.headers?.['link'] ?? response.headers?.['Link']
    );

    if (!nextPage) {
      return results;
    }

    currentQuery = {
      ...(query ?? {}),
      page: nextPage,
    };
  }

  return results;
}

const TAPFILIATE_MAX_PAGES = 500;
