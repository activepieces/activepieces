import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const DEFILLAMA_BASE = 'https://api.llama.fi';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export async function makeRequest(url: string) {
  const res = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url,
  });
  return res.body;
}

export async function getCosmosProtocolTvl() {
  return makeRequest(DEFILLAMA_BASE + '/protocol/cosmos');
}

export async function getAtomPrice() {
  return makeRequest(
    COINGECKO_BASE +
      '/coins/cosmos?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false'
  );
}

export async function getCosmosChainBreakdown() {
  const data = await makeRequest(DEFILLAMA_BASE + '/protocol/cosmos');
  return (data as any)?.chainTvls ?? {};
}

export async function getCosmosTvlHistory() {
  const data = await makeRequest(DEFILLAMA_BASE + '/protocol/cosmos');
  const tvl: Array<{ date: number; totalLiquidityUSD: number }> =
    (data as any)?.tvl ?? [];
  const cutoff = Date.now() / 1000 - 30 * 24 * 60 * 60;
  return tvl.filter((entry) => entry.date >= cutoff);
}

export async function getCosmosProtocolStats() {
  const data = await makeRequest(DEFILLAMA_BASE + '/protocol/cosmos');
  const d = data as any;
  const tvl: Array<{ date: number; totalLiquidityUSD: number }> = d?.tvl ?? [];
  const latestTvl =
    tvl.length > 0 ? tvl[tvl.length - 1].totalLiquidityUSD : null;
  return {
    name: d?.name,
    category: d?.category,
    chains: d?.chains ?? [],
    chainCount: (d?.chains ?? []).length,
    currentTvl: latestTvl,
    description: d?.description,
    url: d?.url,
    twitter: d?.twitter,
    gecko_id: d?.gecko_id,
  };
}
