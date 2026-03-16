import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.coinranking.com/v2';

export async function coinrankingRequest<T>(
  apiKey: string,
  path: string,
  queryParams?: Record<string, string | number | undefined>
): Promise<T> {
  const url = new URL(BASE_URL + path);

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
      'x-access-token': apiKey,
    },
  });

  if (response.status !== 200) {
    throw new Error(
      `CoinRanking API error ${response.status}: ${JSON.stringify(response.body)}`
    );
  }

  return response.body;
}
