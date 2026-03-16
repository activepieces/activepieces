import {
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.coincap.io/v2';

export async function makeRequest(
  method: HttpMethod,
  endpoint: string,
  params?: Record<string, string | number | undefined>
) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await httpClient.sendRequest({
    method,
    url: url.toString(),
    headers: {
      'Accept': 'application/json',
    },
  });

  return response.body;
}
