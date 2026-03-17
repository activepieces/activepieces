import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const DEFILLAMA_BASE = 'https://api.llama.fi';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export interface DefiLlamaProtocol {
  name: string;
  symbol: string;
  tvl: number;
  chainTvls: Record<string, number>;
  chains: string[];
  currentChainTvls: Record<string, number>;
  tvlList?: Array<{ date: number; totalLiquidityUSD: number }>;
}

export interface CoinGeckoPrice {
  usd: number;
  usd_market_cap?: number;
  usd_24h_change?: number;
}

export interface ChainBreakdownItem {
  chain: string;
  tvl: number;
  percentage: number;
}

export interface TvlHistoryItem {
  date: string;
  tvl: number;
  changeFromBaseline: number;
}

export async function fetchProtocolData(): Promise<DefiLlamaProtocol> {
  const response = await httpClient.sendRequest<DefiLlamaProtocol>({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE}/protocol/liquid-collective`,
  });
  return response.body;
}

export async function fetchLsethPrice(): Promise<CoinGeckoPrice> {
  // Try primary CoinGecko ID first, fall back to 'lseth'
  let response = await httpClient.sendRequest<Record<string, CoinGeckoPrice>>({
    method: HttpMethod.GET,
    url: `${COINGECKO_BASE}/simple/price`,
    queryParams: {
      ids: 'liquid-staked-ether',
      vs_currencies: 'usd',
      include_market_cap: 'true',
      include_24hr_change: 'true',
    },
  });

  let priceData = response.body['liquid-staked-ether'];

  if (!priceData || !priceData.usd) {
    // Fallback to 'lseth' ID
    response = await httpClient.sendRequest<Record<string, CoinGeckoPrice>>({
      method: HttpMethod.GET,
      url: `${COINGECKO_BASE}/simple/price`,
      queryParams: {
        ids: 'lseth',
        vs_currencies: 'usd',
        include_market_cap: 'true',
        include_24hr_change: 'true',
      },
    });
    priceData = response.body['lseth'];
  }

  if (!priceData || !priceData.usd) {
    throw new Error('LsETH price data not available from CoinGecko');
  }

  return priceData;
}

export function buildChainBreakdown(protocol: DefiLlamaProtocol): ChainBreakdownItem[] {
  const chainTvls = protocol.currentChainTvls ?? protocol.chainTvls ?? {};
  const entries = Object.entries(chainTvls);

  if (entries.length === 0) return [];

  const totalTvl = entries.reduce((sum, [, tvl]) => sum + tvl, 0);

  return entries
    .map(([chain, tvl]) => ({
      chain,
      tvl,
      percentage: totalTvl > 0 ? parseFloat(((tvl / totalTvl) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.tvl - a.tvl);
}

export function buildTvlHistory(protocol: DefiLlamaProtocol, days: number): TvlHistoryItem[] {
  const tvlList = protocol.tvlList ?? [];
  if (tvlList.length === 0) return [];

  const cutoffDate = Date.now() / 1000 - days * 86400;
  const filtered = tvlList.filter((entry) => entry.date >= cutoffDate);

  if (filtered.length === 0) return [];

  const baseline = filtered[0].totalLiquidityUSD;

  return filtered.map((entry) => {
    const date = new Date(entry.date * 1000).toISOString().split('T')[0];
    const tvl = entry.totalLiquidityUSD;
    const changeFromBaseline =
      baseline > 0 ? parseFloat((((tvl - baseline) / baseline) * 100).toFixed(2)) : 0;

    return { date, tvl, changeFromBaseline };
  });
}
