import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const BASE_URL = 'https://deep-index.moralis.io/api/v2.2';

export async function moralisRequest<T>(
  apiKey: string,
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const queryParams: Record<string, string> = {};
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        queryParams[key] = value;
      }
    }
  }

  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url: `${BASE_URL}${path}`,
    headers: {
      accept: 'application/json',
      'X-API-Key': apiKey,
    },
    queryParams,
  });

  return response.body;
}
