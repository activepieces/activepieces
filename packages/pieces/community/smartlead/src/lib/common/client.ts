import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://server.smartlead.ai/api/v1';

export async function smartleadRequest<T = Record<string, unknown>>({
  endpoint,
  method,
  apiKey,
  body,
  queryParams = {},
}: {
  endpoint: string;
  method: HttpMethod;
  apiKey: string;
  body?: Record<string, unknown>;
  queryParams?: Record<string, string | number | boolean>;
}): Promise<T> {
  const allParams: Record<string, string> = {
    api_key: apiKey,
  };

  for (const [k, value] of Object.entries(queryParams)) {
    if (value !== undefined && value !== null) {
      allParams[k] = String(value);
    }
  }

  const response = await httpClient.sendRequest({
    method,
    url: `${BASE_URL}/${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
    },
    queryParams: allParams,
    body,
  });

  return response.body as T;
}
