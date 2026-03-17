import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const DEFILLAMA_BASE_URL = 'https://api.llama.fi';
export const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

export interface DefiLlamaProtocol {
  id: string;
  name: string;
  tvl: number;
  change_1h: number | null;
  change_1d: number | null;
  change_7d: number | null;
  chainTvls: Record<string, { tvl: Array<{ date: number; totalLiquidityUSD: number }> }>;
  tvl: Array<{ date: number; totalLiquidityUSD: number }>;
}

export interface CoinGeckoCoin {
  id: string;
  symbol: string;
  name: string;
  market_data: {
    current_price: { usd: number };
    market_cap: { usd: number };
    price_change_percentage_24h: number;
    total_volume: { usd: number };
  };
}

export async function getProtocolData(): Promise<any> {
  const response = await httpClient.sendRequest<any>({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE_URL}/protocol/frax-ether`,
  });
  return response.body;
}

export async function getCoinData(coinId: string): Promise<CoinGeckoCoin> {
  const response = await httpClient.sendRequest<CoinGeckoCoin>({
    method: HttpMethod.GET,
    url: `${COINGECKO_BASE_URL}/coins/${coinId}`,
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

export function formatUSD(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}
