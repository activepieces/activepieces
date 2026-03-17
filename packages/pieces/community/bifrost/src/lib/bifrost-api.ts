import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const DEFILLAMA_BASE = 'https://api.llama.fi';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const PROTOCOL_SLUG = 'bifrost-liquid-staking';
const BNC_COIN_ID = 'bifrost-native-coin';

// ── Types ────────────────────────────────────────────────────────────────────

export interface TvlDataPoint {
  date: number;
  totalLiquidityUSD: number;
}

export interface ChainTvlData {
  tvl: TvlDataPoint[];
}

export interface DefiLlamaProtocol {
  id: string;
  name: string;
  symbol: string;
  description: string;
  chain: string;
  chains: string[];
  tvl: number;
  chainTvls: Record<string, ChainTvlData>;
  currentChainTvls: Record<string, number>;
  gecko_id: string;
  url: string;
  logo: string;
}

export interface CoinGeckoMarketData {
  current_price: Record<string, number>;
  market_cap: Record<string, number>;
  price_change_percentage_24h: number;
  total_volume: Record<string, number>;
}

export interface CoinGeckoCoin {
  id: string;
  symbol: string;
  name: string;
  market_data: CoinGeckoMarketData;
}

export interface ChainBreakdownItem {
  chain: string;
  tvlUSD: number;
  percentage: number;
}

export interface TvlHistoryItem {
  date: string;
  timestamp: number;
  tvlUSD: number;
  changeFromBaselinePct: number | null;
}

export interface ProtocolStats {
  tvl: number;
  chains: string[];
  bncPriceUSD: number;
  bncMarketCapUSD: number;
  bncPriceChange24h: number;
  fetchedAt: string;
}

// ── API functions ─────────────────────────────────────────────────────────────

export async function fetchProtocol(): Promise<DefiLlamaProtocol> {
  const response = await httpClient.sendRequest<DefiLlamaProtocol>({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE}/protocol/${PROTOCOL_SLUG}`,
  });
  return response.body;
}

export async function fetchBncCoin(): Promise<CoinGeckoCoin> {
  const response = await httpClient.sendRequest<CoinGeckoCoin>({
    method: HttpMethod.GET,
    url: `${COINGECKO_BASE}/coins/${BNC_COIN_ID}`,
    queryParams: {
      localization: 'false',
      tickers: 'false',
      market_data: 'true',
      community_data: 'false',
      developer_data: 'false',
      sparkline: 'false',
    },
  });
  return response.body;
}

export async function fetchTvlHistory(): Promise<TvlDataPoint[]> {
  const response = await httpClient.sendRequest<TvlDataPoint[]>({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE}/protocol/${PROTOCOL_SLUG}`,
  });
  // Extract the aggregate TVL from chainTvls or the main tvl array
  const protocol = response.body as unknown as DefiLlamaProtocol;
  // Get Bifrost chain TVL as primary (it's the main chain)
  if (protocol.chainTvls?.['Bifrost']?.tvl) {
    return protocol.chainTvls['Bifrost'].tvl;
  }
  // Fallback: sum all chains per date
  const dateMap: Record<number, number> = {};
  for (const chainData of Object.values(protocol.chainTvls ?? {})) {
    for (const point of chainData.tvl ?? []) {
      dateMap[point.date] = (dateMap[point.date] ?? 0) + point.totalLiquidityUSD;
    }
  }
  return Object.entries(dateMap)
    .map(([date, totalLiquidityUSD]) => ({ date: Number(date), totalLiquidityUSD }))
    .sort((a, b) => a.date - b.date);
}
