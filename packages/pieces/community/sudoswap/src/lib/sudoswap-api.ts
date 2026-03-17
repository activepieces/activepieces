import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const DEFILLAMA_BASE = 'https://api.llama.fi';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export async function defiLlamaRequest<T>(endpoint: string): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE}${endpoint}`,
    headers: { Accept: 'application/json' },
  });
  return response.body;
}

export async function coinGeckoRequest<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${COINGECKO_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url: url.toString(),
    headers: { Accept: 'application/json' },
  });
  return response.body;
}
