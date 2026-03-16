import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.1inch.dev';

export async function oneInchRequest(
  apiKey: string,
  method: HttpMethod,
  path: string,
  params?: Record<string, string>
) {
  const url = `${BASE_URL}${path}`;
  return httpClient.sendRequest({
    method,
    url,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
    queryParams: params,
  });
}
