import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export async function coinglassRequest<T>(
  apiKey: string,
  path: string,
  queryParams?: Record<string, string | number | undefined>
): Promise<T> {
  const url = new URL('https://open-api-v4.coinglass.com' + path);
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url: url.toString(),
    headers: {
      coinglassSecret: apiKey,
    },
  });

  if (response.status !== 200) {
    throw new Error(
      `CoinGlass API error ${response.status}: ${JSON.stringify(response.body)}`
    );
  }

  return response.body;
}
