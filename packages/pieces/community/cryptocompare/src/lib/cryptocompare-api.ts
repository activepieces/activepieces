import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://min-api.cryptocompare.com';

export async function cryptocompareRequest<T>(
  apiKey: string,
  path: string,
  params: Record<string, string | number>
): Promise<T> {
  const queryString = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');

  const url = `${BASE_URL}${path}?${queryString}`;

  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url,
    headers: {
      Authorization: `Apikey ${apiKey}`,
    },
  });

  return response.body;
}
