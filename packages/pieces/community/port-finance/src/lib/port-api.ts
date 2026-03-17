import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const DEFILLAMA_BASE_URL = 'https://api.llama.fi';
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
const PROTOCOL_SLUG = 'port-finance';
const COINGECKO_ID = 'port-finance';

export async function getDefiLlamaProtocol(): Promise<any> {
  const response = await httpClient.sendRequest<any>({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE_URL}/protocol/${PROTOCOL_SLUG}`,
    headers: { Accept: 'application/json' },
  });
  return response.body;
}

export async function getCoinGeckoData(): Promise<any> {
  const response = await httpClient.sendRequest<any>({
    method: HttpMethod.GET,
    url: `${COINGECKO_BASE_URL}/coins/${COINGECKO_ID}`,
    headers: { Accept: 'application/json' },
  });
  return response.body;
}
