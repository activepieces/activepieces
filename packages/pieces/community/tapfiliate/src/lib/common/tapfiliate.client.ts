import {
  HttpMessageBody,
  HttpMethod,
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

export async function tapfiliateApiCall<T extends HttpMessageBody>({
  method,
  path,
  apiKey,
  apiBaseUrl = TAPFILIATE_BASE_URL,
  query,
  body,
}: TapfiliateApiCallParams): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${apiBaseUrl}${path}`,
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
    queryParams: query,
    body,
  });

  return response.body;
}
