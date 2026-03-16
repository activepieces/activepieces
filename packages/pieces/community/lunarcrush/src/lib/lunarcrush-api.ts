import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const BASE_URL = 'https://lunarcrush.com/api4/public';

export async function lunarCrushRequest<T>(
  apiKey: string,
  endpoint: string,
  params?: Record<string, string | number>
): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url: url.toString(),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  });

  return response.body;
}
