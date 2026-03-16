import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export async function birdeyeRequest<T>(
  apiKey: string,
  path: string,
  chain: string,
  queryParams: Record<string, string | number | undefined> = {}
): Promise<T> {
  const url = new URL(`https://public-api.birdeye.so${path}`);
  Object.entries(queryParams).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });

  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url: url.toString(),
    headers: {
      'X-API-KEY': apiKey,
      'x-chain': chain,
      'Accept': 'application/json',
    },
  });

  return response.body;
}
