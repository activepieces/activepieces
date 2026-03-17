import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const DEFILLAMA_BASE = 'https://api.llama.fi';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const PROTOCOL_SLUG = 'ether.fi';
const TOKEN_ID = 'ether-fi';

export interface ProtocolData {
  name: string;
  tvl: number;
  chains: string[];
  chainTvls: Record<string, { tvl: { date: number; totalLiquidityUSD: number }[] }>;
  tvlHistory: { date: number; totalLiquidityUSD: number }[];
}

export interface TokenPriceData {
  price: number;
  market_cap: number;
  change_24h: number;
}

export interface ChainBreakdown {
  chain: string;
  tvl: number;
  percentage: number;
}

export interface TvlHistoryPoint {
  date: string;
  tvl: number;
  change_pct: number | null;
}

export interface ProtocolStats {
  name: string;
  tvl: number;
  chains: string[];
  token_price_usd: number;
  token_market_cap_usd: number;
  token_24h_change_pct: number;
}

export async function fetchProtocolData(): Promise<ProtocolData> {
  const response = await httpClient.sendRequest<{
    name: string;
    currentChainTvls: Record<string, number>;
    chainTvls: Record<string, { tvl: { date: number; totalLiquidityUSD: number }[] }>;
    tvl: { date: number; totalLiquidityUSD: number }[];
  }>({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE}/protocol/${PROTOCOL_SLUG}`,
  });

  const body = response.body;
  const chains = Object.keys(body.currentChainTvls ?? {});
  const tvlValues = body.currentChainTvls ?? {};
  const totalTvl = Object.values(tvlValues).reduce((sum, val) => sum + val, 0);

  return {
    name: body.name,
    tvl: totalTvl,
    chains,
    chainTvls: body.chainTvls ?? {},
    tvlHistory: body.tvl ?? [],
  };
}

export async function fetchTokenPrice(): Promise<TokenPriceData> {
  const response = await httpClient.sendRequest<
    Record<string, { usd: number; usd_market_cap: number; usd_24h_change: number }>
  >({
    method: HttpMethod.GET,
    url: `${COINGECKO_BASE}/simple/price`,
    queryParams: {
      ids: TOKEN_ID,
      vs_currencies: 'usd',
      include_market_cap: 'true',
      include_24hr_change: 'true',
    },
  });

  const data = response.body[TOKEN_ID];
  if (!data) {
    throw new Error(`No price data returned for token: ${TOKEN_ID}`);
  }

  return {
    price: data.usd,
    market_cap: data.usd_market_cap,
    change_24h: data.usd_24h_change,
  };
}

export function parseChainBreakdown(
  currentChainTvls: Record<string, number>
): ChainBreakdown[] {
  const total = Object.values(currentChainTvls).reduce((sum, val) => sum + val, 0);
  if (total === 0) return [];

  return Object.entries(currentChainTvls)
    .map(([chain, tvl]) => ({
      chain,
      tvl,
      percentage: parseFloat(((tvl / total) * 100).toFixed(2)),
    }))
    .sort((a, b) => b.tvl - a.tvl);
}

export function parseTvlHistory(
  tvlArray: { date: number; totalLiquidityUSD: number }[],
  days: number
): TvlHistoryPoint[] {
  if (!tvlArray || tvlArray.length === 0) return [];

  const sorted = [...tvlArray].sort((a, b) => a.date - b.date);
  const slice = sorted.slice(-days);

  return slice.map((point, index) => {
    const date = new Date(point.date * 1000).toISOString().split('T')[0];
    const change_pct =
      index === 0
        ? null
        : parseFloat(
            (((point.totalLiquidityUSD - slice[0].totalLiquidityUSD) /
              slice[0].totalLiquidityUSD) *
              100).toFixed(2)
          );
    return {
      date,
      tvl: point.totalLiquidityUSD,
      change_pct,
    };
  });
}
