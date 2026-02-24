import { HttpMethod, httpClient, HttpMessageBody, QueryParams } from '@activepieces/pieces-common';

export const HYSTRUCT_BASE_URL = 'https://api.hystruct.com';

export type HystructApiCallParams = {
  apiKey: string;
  method: HttpMethod;
  endpoint: string;
  query?: Record<string, string | number | string[] | undefined>;
  body?: unknown;
};

export async function hystructApiCall<T extends HttpMessageBody>({
  apiKey,
  method,
  endpoint,
  query,
  body,
}: HystructApiCallParams): Promise<T> {
  const qs: QueryParams = {};

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        qs[key] = String(value);
      }
    }
  }

  const response = await httpClient.sendRequest<T>({
    method,
    url: `${HYSTRUCT_BASE_URL}${endpoint}`,
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    queryParams: qs,
    body,
  });

  return response.body;
}
