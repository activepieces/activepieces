import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const DEFILLAMA_BASE = 'https://api.llama.fi';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export interface DefiLlamaProtocol {
  name: string;
  tvl: number;
  chains: string[];
  chainTvls: Record<string, number | { tvl: { date: number; totalLiquidityUSD: number }[]; tokens: unknown[]; tokensInUsd: unknown[] }>;
  tvlHistory: { date: number; totalLiquidityUSD: number }[];
}

export interface ChainBreakdownEntry {
  chain: string;
  tvl: number;
  percentage: number;
}

export interface TvlHistoryEntry {
  date: string;
  timestamp: number;
  totalLiquidityUSD: number;
}

export interface TvlHistoryResult {
  history: TvlHistoryEntry[];
  percentChange: number | null;
}

export interface CoinGeckoPrice {
  usd: number;
  usd_market_cap: number;
  usd_24h_change: number;
}

export interface SwellPrice {
  price: number;
  market_cap: number;
  change_24h: number;
}

export interface ProtocolTvlResult {
  name: string;
  tvl: number;
  chains: string[];
}

export interface ProtocolStatsResult extends ProtocolTvlResult {
  price: number;
  market_cap: number;
  change_24h: number;
}

async function fetchDefiLlamaProtocol(): Promise<DefiLlamaProtocol> {
  const response = await httpClient.sendRequest<DefiLlamaProtocol>({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE}/protocol/swell-network`,
  });
  return response.body;
}

export async function getProtocolTvl(): Promise<ProtocolTvlResult> {
  const data = await fetchDefiLlamaProtocol();
  return {
    name: data.name,
    tvl: data.tvl,
    chains: data.chains,
  };
}

export async function getChainBreakdown(): Promise<ChainBreakdownEntry[]> {
  const data = await fetchDefiLlamaProtocol();
  const chainTvls = data.chainTvls || {};

  const entries: { chain: string; tvl: number }[] = [];

  for (const [chain, value] of Object.entries(chainTvls)) {
    // chainTvls values can be a number or an object with a nested tvl array
    if (typeof value === 'number') {
      entries.push({ chain, tvl: value });
    } else if (value && typeof value === 'object' && 'tvl' in value && Array.isArray(value.tvl)) {
      // Get the most recent tvl entry
      const tvlArray = value.tvl as { date: number; totalLiquidityUSD: number }[];
      if (tvlArray.length > 0) {
        const latest = tvlArray[tvlArray.length - 1];
        entries.push({ chain, tvl: latest.totalLiquidityUSD });
      }
    }
  }

  const total = entries.reduce((sum, e) => sum + e.tvl, 0);

  return entries
    .sort((a, b) => b.tvl - a.tvl)
    .map((e) => ({
      chain: e.chain,
      tvl: e.tvl,
      percentage: total > 0 ? parseFloat(((e.tvl / total) * 100).toFixed(2)) : 0,
    }));
}

export async function getTvlHistory(days = 30): Promise<TvlHistoryResult> {
  const data = await fetchDefiLlamaProtocol();
  const tvlArray = data.tvlHistory || (data as unknown as { tvl: { date: number; totalLiquidityUSD: number }[] }).tvl || [];

  // Sort ascending
  const sorted = [...tvlArray].sort((a, b) => a.date - b.date);

  // Slice to requested days
  const sliced = sorted.slice(-days);

  const history: TvlHistoryEntry[] = sliced.map((entry) => ({
    date: new Date(entry.date * 1000).toISOString().split('T')[0],
    timestamp: entry.date,
    totalLiquidityUSD: entry.totalLiquidityUSD,
  }));

  let percentChange: number | null = null;
  if (history.length >= 2) {
    const first = history[0].totalLiquidityUSD;
    const last = history[history.length - 1].totalLiquidityUSD;
    if (first > 0) {
      percentChange = parseFloat((((last - first) / first) * 100).toFixed(2));
    }
  }

  return { history, percentChange };
}

export async function getSwellPrice(): Promise<SwellPrice> {
  const response = await httpClient.sendRequest<Record<string, CoinGeckoPrice>>({
    method: HttpMethod.GET,
    url: `${COINGECKO_BASE}/simple/price`,
    queryParams: {
      ids: 'swell-network',
      vs_currencies: 'usd',
      include_market_cap: 'true',
      include_24hr_change: 'true',
    },
  });

  const data = response.body['swell-network'];
  return {
    price: data.usd,
    market_cap: data.usd_market_cap,
    change_24h: data.usd_24h_change,
  };
}

export async function getProtocolStats(): Promise<ProtocolStatsResult> {
  const [tvl, price] = await Promise.all([getProtocolTvl(), getSwellPrice()]);
  return {
    ...tvl,
    ...price,
  };
}
