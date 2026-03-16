import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const DEFILLAMA_BASE = 'https://api.llama.fi';
export const DEFILLAMA_YIELDS_BASE = 'https://yields.llama.fi';
export const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export async function fetchProtocolTvl() {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE}/protocol/stargate`,
  });
  return response.body;
}

export async function fetchStgPrice() {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${COINGECKO_BASE}/simple/price?ids=stargate-finance&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true`,
  });
  return response.body;
}

export async function fetchBridgePools() {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_YIELDS_BASE}/pools`,
  });
  const data = response.body as { data: Array<{ project: string; [key: string]: unknown }> };
  return data.data.filter((pool) => pool.project === 'stargate');
}

export async function fetchProtocolVolume() {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE}/summary/bridges/stargate`,
  });
  return response.body;
}

export async function fetchChainTvl() {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE}/tvl/stargate`,
  });
  return response.body;
}
