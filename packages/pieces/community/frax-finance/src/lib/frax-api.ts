import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const DEFILLAMA_BASE = 'https://api.llama.fi';
const DEFILLAMA_YIELDS_BASE = 'https://yields.llama.fi';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export async function makeRequest(
  path: string,
  base: string = DEFILLAMA_BASE
): Promise<unknown> {
  const res = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${base}${path}`,
  });
  return res.body;
}

export async function getProtocolData(): Promise<unknown> {
  return makeRequest('/protocol/frax', DEFILLAMA_BASE);
}

export async function getFraxPriceData(): Promise<unknown> {
  return makeRequest(
    '/simple/price?ids=frax,frax-share&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true',
    COINGECKO_BASE
  );
}

export async function getYieldPools(): Promise<{ data: Array<Record<string, unknown>> }> {
  return makeRequest('/pools', DEFILLAMA_YIELDS_BASE) as Promise<{ data: Array<Record<string, unknown>> }>;
}
