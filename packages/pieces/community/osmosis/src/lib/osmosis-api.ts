import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const DEFILLAMA_BASE = 'https://api.llama.fi';
const DEFILLAMA_YIELDS_BASE = 'https://yields.llama.fi';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export async function makeRequest(path: string, base = DEFILLAMA_BASE) {
  const res = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${base}${path}`,
  });
  return res.body;
}

export async function getProtocolTvl() {
  return makeRequest('/protocol/osmosis', DEFILLAMA_BASE);
}

export async function getOsmoPrice() {
  return makeRequest(
    '/simple/price?ids=osmosis&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true',
    COINGECKO_BASE
  );
}

export async function getOsmosisPools() {
  const data = await makeRequest('/pools', DEFILLAMA_YIELDS_BASE);
  const pools = data?.data ?? data;
  return Array.isArray(pools)
    ? pools.filter((p: any) => p.project === 'osmosis')
    : [];
}

export async function getOsmosisPoolApys(minApy?: number) {
  const pools = await getOsmosisPools();
  if (minApy !== undefined && minApy !== null) {
    return pools.filter((p: any) => typeof p.apy === 'number' && p.apy >= minApy);
  }
  return pools;
}

export async function getChainStats() {
  const chains = await makeRequest('/v2/chains', DEFILLAMA_BASE);
  const arr = Array.isArray(chains) ? chains : [];
  return arr.find(
    (c: any) =>
      c.name?.toLowerCase() === 'osmosis' ||
      c.gecko_id?.toLowerCase() === 'osmosis'
  ) ?? null;
}
