import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const DEFILLAMA_BASE_URL = 'https://api.llama.fi';
export const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
export const CARDANO_SLUG = 'cardano';

export async function defiLlamaGet(path: string) {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE_URL}${path}`,
  });
  if (response.status !== 200) {
    throw new Error(`DeFiLlama API error: ${response.status}`);
  }
  return response.body;
}

export async function coinGeckoGet(path: string, queryParams?: Record<string, string>) {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${COINGECKO_BASE_URL}${path}`,
    queryParams,
  });
  if (response.status !== 200) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }
  return response.body;
}
