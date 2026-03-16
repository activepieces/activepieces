import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const DEFILLAMA_BASE = 'https://api.llama.fi';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const DEFILLAMA_YIELDS = 'https://yields.llama.fi';

export async function defiLlamaRequest<T>(endpoint: string): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE}${endpoint}`,
    headers: { 'Accept': 'application/json' },
  });
  return response.body;
}

export async function coinGeckoRequest<T>(endpoint: string): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url: `${COINGECKO_BASE}${endpoint}`,
    headers: { 'Accept': 'application/json' },
  });
  return response.body;
}

export async function defiLlamaYieldsRequest<T>(endpoint: string): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_YIELDS}${endpoint}`,
    headers: { 'Accept': 'application/json' },
  });
  return response.body;
}
