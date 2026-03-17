import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const DEFILLAMA_BASE = 'https://api.llama.fi';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export interface DefiLlamaProtocol {
  name: string;
  tvl: number;
  chains: string[];
  chainTvls: Record<string, { tvl: { date: number; totalLiquidityUSD: number }[] }>;
  tvl_array: { date: number; totalLiquidityUSD: number }[];
}

export interface ChainBreakdownItem {
  chain: string;
  tvl: number;
  percentage: number;
}

export interface TvlHistoryItem {
  date: string;
  tvl: number;
  percentageChange: number;
}

export interface CoinGeckoPrice {
  eigenlayer: {
    usd: number;
    usd_market_cap: number;
    usd_24h_change: number;
  };
}

export async function fetchEigenLayerProtocol(): Promise<DefiLlamaProtocol> {
  const response = await httpClient.sendRequest<Record<string, unknown>>({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE}/protocol/eigenlayer`,
  });

  const data = response.body;

  const name = (data['name'] as string) ?? 'EigenLayer';
  const tvl = (data['tvl'] as number) ?? 0;
  const chains = (data['chains'] as string[]) ?? [];
  const chainTvls = (data['chainTvls'] as Record<string, { tvl: { date: number; totalLiquidityUSD: number }[] }>) ?? {};
  const tvl_array = (data['tvl'] as { date: number; totalLiquidityUSD: number }[]) ?? [];

  // DeFiLlama returns `tvl` as both a number (current) and array (history)
  // Check the actual type
  const currentTvl = typeof tvl === 'number' ? tvl : 0;

  return {
    name,
    tvl: currentTvl,
    chains,
    chainTvls,
    tvl_array: Array.isArray(data['tvl']) ? (data['tvl'] as { date: number; totalLiquidityUSD: number }[]) : [],
  };
}

export async function fetchEigenPrice(): Promise<CoinGeckoPrice> {
  const response = await httpClient.sendRequest<CoinGeckoPrice>({
    method: HttpMethod.GET,
    url: `${COINGECKO_BASE}/simple/price`,
    queryParams: {
      ids: 'eigenlayer',
      vs_currencies: 'usd',
      include_market_cap: 'true',
      include_24hr_change: 'true',
    },
  });

  return response.body;
}

export function parseChainBreakdown(
  chainTvls: Record<string, { tvl: { date: number; totalLiquidityUSD: number }[] }>
): ChainBreakdownItem[] {
  const chainLatestTvl: Record<string, number> = {};

  for (const [chain, data] of Object.entries(chainTvls)) {
    // Skip non-chain keys like "staking", "pool2" etc.
    if (!data.tvl || !Array.isArray(data.tvl) || data.tvl.length === 0) continue;
    const latest = data.tvl[data.tvl.length - 1];
    if (latest && latest.totalLiquidityUSD !== undefined) {
      chainLatestTvl[chain] = latest.totalLiquidityUSD;
    }
  }

  const totalTvl = Object.values(chainLatestTvl).reduce((sum, v) => sum + v, 0);

  const breakdown: ChainBreakdownItem[] = Object.entries(chainLatestTvl).map(([chain, tvl]) => ({
    chain,
    tvl,
    percentage: totalTvl > 0 ? Math.round((tvl / totalTvl) * 10000) / 100 : 0,
  }));

  return breakdown.sort((a, b) => b.tvl - a.tvl);
}

export function parseTvlHistory(
  tvlArray: { date: number; totalLiquidityUSD: number }[],
  days: number
): TvlHistoryItem[] {
  if (!tvlArray || tvlArray.length === 0) return [];

  const cutoff = Date.now() / 1000 - days * 86400;
  const filtered = tvlArray.filter((entry) => entry.date >= cutoff);
  const slice = filtered.length > 0 ? filtered : tvlArray.slice(-days);

  const baseline = slice[0]?.totalLiquidityUSD ?? 1;

  return slice.map((entry) => {
    const date = new Date(entry.date * 1000).toISOString().split('T')[0] ?? '';
    const percentageChange =
      Math.round(((entry.totalLiquidityUSD - baseline) / baseline) * 10000) / 100;
    return {
      date,
      tvl: entry.totalLiquidityUSD,
      percentageChange,
    };
  });
}
