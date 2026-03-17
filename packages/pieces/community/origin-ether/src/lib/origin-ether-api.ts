import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const DEFILLAMA_BASE_URL = 'https://api.llama.fi';
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

export interface DefiLlamaHistoricalEntry {
  date: number;
  totalLiquidityUSD: number;
}

export interface DefiLlamaProtocolResponse {
  id: string;
  name: string;
  symbol: string;
  url: string;
  description: string;
  chain: string;
  logo: string;
  category: string;
  chains: string[];
  tvl: DefiLlamaHistoricalEntry[];
  currentChainTvls: Record<string, number>;
  change_1h: number | null;
  change_1d: number | null;
  change_7d: number | null;
  mcap: number | null;
}

export interface CoinGeckoMarketData {
  current_price: Record<string, number>;
  market_cap: Record<string, number>;
  price_change_percentage_24h: number | null;
}

export interface CoinGeckoCoin {
  id: string;
  symbol: string;
  name: string;
  market_data: CoinGeckoMarketData;
}

export interface ChainBreakdownEntry {
  chain: string;
  tvl: number;
  percentage: number;
}

export interface TvlHistoryEntry {
  date: string;
  timestamp: number;
  tvl: number;
  changeFromBaseline: number;
}

export interface ProtocolStats {
  protocol: {
    name: string;
    tvlUsd: number;
    change1d: number | null;
    change7d: number | null;
    chains: string[];
  };
  token: {
    symbol: string;
    priceUsd: number;
    marketCapUsd: number;
    priceChange24h: number | null;
  };
  fetchedAt: string;
}

export async function fetchProtocolData(): Promise<DefiLlamaProtocolResponse> {
  const response = await httpClient.sendRequest<DefiLlamaProtocolResponse>({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE_URL}/protocol/origin-ether`,
  });
  return response.body;
}

export async function fetchOethCoinData(): Promise<CoinGeckoCoin> {
  const response = await httpClient.sendRequest<CoinGeckoCoin>({
    method: HttpMethod.GET,
    url: `${COINGECKO_BASE_URL}/coins/origin-ether`,
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
