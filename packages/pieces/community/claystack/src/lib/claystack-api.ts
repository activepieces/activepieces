import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const DEFILLAMA_BASE = 'https://api.llama.fi';
export const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export interface TvlDataPoint {
  date: number;
  totalLiquidityUSD: number;
}

export interface ChainTvl {
  tvl: TvlDataPoint[];
}

export interface ClayStackProtocol {
  id: string;
  name: string;
  url: string;
  description: string;
  gecko_id: string | null;
  chains: string[];
  symbol: string;
  currentChainTvls: Record<string, number>;
  chainTvls: Record<string, ChainTvl>;
  tvl: TvlDataPoint[];
  change_1h: number | null;
  change_1d: number | null;
  change_7d: number | null;
}

export interface CoinGeckoMarketData {
  current_price: Record<string, number>;
  market_cap: Record<string, number>;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  total_volume: Record<string, number>;
  circulating_supply: number;
  total_supply: number | null;
}

export interface CoinGeckoCoin {
  id: string;
  symbol: string;
  name: string;
  description: Record<string, string>;
  market_data: CoinGeckoMarketData;
  last_updated: string;
}

export async function fetchProtocol(): Promise<ClayStackProtocol> {
  const response = await httpClient.sendRequest<ClayStackProtocol>({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE}/protocol/claystack`,
  });
  return response.body;
}

export async function fetchCsToken(): Promise<CoinGeckoCoin> {
  // Try primary id first, fall back to alternate
  try {
    const response = await httpClient.sendRequest<CoinGeckoCoin>({
      method: HttpMethod.GET,
      url: `${COINGECKO_BASE}/coins/claystack-cs`,
      queryParams: {
        localization: 'false',
        tickers: 'false',
        market_data: 'true',
        community_data: 'false',
        developer_data: 'false',
      },
    });
    return response.body;
  } catch {
    const response = await httpClient.sendRequest<CoinGeckoCoin>({
      method: HttpMethod.GET,
      url: `${COINGECKO_BASE}/coins/claystack`,
      queryParams: {
        localization: 'false',
        tickers: 'false',
        market_data: 'true',
        community_data: 'false',
        developer_data: 'false',
      },
    });
    return response.body;
  }
}

export function calcPctChange(current: number, previous: number): number | null {
  if (!previous || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}
