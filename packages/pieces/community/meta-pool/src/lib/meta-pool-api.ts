import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const DEFILLAMA_BASE = 'https://api.llama.fi';
export const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
export const PROTOCOL_SLUG = 'meta-pool';
export const COINGECKO_ID = 'meta-pool';

export interface ProtocolTvlResponse {
  id: string;
  name: string;
  url: string;
  description: string;
  logo: string;
  chains: string[];
  symbol: string;
  tvl: number;
  change_1h: number;
  change_1d: number;
  change_7d: number;
  currentChainTvls: Record<string, number>;
  chainTvls: Record<string, { tvl: Array<{ date: number; totalLiquidityUSD: number }> }>;
}

export interface CoinGeckoPriceResponse {
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

export async function fetchProtocolTvl(): Promise<ProtocolTvlResponse> {
  const response = await httpClient.sendRequest<ProtocolTvlResponse>({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE}/protocol/${PROTOCOL_SLUG}`,
  });
  return response.body;
}

export async function fetchTokenPrice(): Promise<CoinGeckoPriceResponse> {
  const response = await httpClient.sendRequest<CoinGeckoPriceResponse>({
    method: HttpMethod.GET,
    url: `${COINGECKO_BASE}/coins/${COINGECKO_ID}`,
    queryParams: {
      localization: 'false',
      tickers: 'false',
      community_data: 'false',
      developer_data: 'false',
    },
  });
  return response.body;
}

export function calcPctChange(current: number, previous: number): number {
  if (!previous || previous === 0) return 0;
  return parseFloat((((current - previous) / previous) * 100).toFixed(2));
}
