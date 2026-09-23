import {
  httpClient,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';

export const WAVIX_BASE_URL = 'https://api.wavix.com';

export async function wavixApiCall<T>({
  apiKey,
  method,
  resourcePath,
  body,
  query,
}: {
  apiKey: string;
  method: HttpMethod;
  resourcePath: string;
  body?: Record<string, unknown>;
  query?: QueryParams;
}): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${WAVIX_BASE_URL}${resourcePath}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(query ? { queryParams: query } : {}),
    body,
  });
  return response.body;
}
