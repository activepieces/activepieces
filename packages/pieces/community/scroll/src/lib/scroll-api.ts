import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const DEFILLAMA_BASE_URL = 'https://api.llama.fi';
export const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

export async function defiLlamaRequest<T>(endpoint: string): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE_URL}${endpoint}`,
    headers: { Accept: 'application/json' },
  });
  return response.body;
}

export async function coinGeckoRequest<T>(endpoint: string): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url: `${COINGECKO_BASE_URL}${endpoint}`,
    headers: { Accept: 'application/json' },
  });
  return response.body;
}
