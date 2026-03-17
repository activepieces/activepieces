import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const DEFILLAMA_BASE = 'https://api.llama.fi';
export const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
export const STAKESTONE_SLUG = 'stakestone';
export const STONE_COINGECKO_ID = 'stakestone-ether';

export interface DefiLlamaProtocol {
  id: string;
  name: string;
  tvl: number;
  chainTvls: Record<string, number>;
  currentChainTvls: Record<string, number>;
  chains: string[];
  symbol: string;
  mcap: number | null;
  change_1h: number | null;
  change_1d: number | null;
  change_7d: number | null;
}

export interface DefiLlamaTvlHistoryPoint {
  date: number;
  totalLiquidityUSD: number;
}

export interface DefiLlamaProtocolDetail extends DefiLlamaProtocol {
  tvl: number;
  currentChainTvls: Record<string, number>;
  chainTvls: Record<string, { tvl: DefiLlamaTvlHistoryPoint[] }>;
}

export interface CoinGeckoCoin {
  id: string;
  symbol: string;
  name: string;
  market_data: {
    current_price: { usd: number };
    market_cap: { usd: number };
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    total_volume: { usd: number };
    circulating_supply: number;
  };
}

export async function fetchProtocolDetail(): Promise<DefiLlamaProtocolDetail> {
  const response = await httpClient.sendRequest<DefiLlamaProtocolDetail>({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE}/protocol/${STAKESTONE_SLUG}`,
  });
  return response.body;
}

export async function fetchProtocolTvl(): Promise<DefiLlamaTvlHistoryPoint[]> {
  const response = await httpClient.sendRequest<DefiLlamaTvlHistoryPoint[]>({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE}/tvl/${STAKESTONE_SLUG}`,
  });
  // If the response is a number (simple TVL endpoint), handle that
  if (typeof response.body === 'number') {
    return [{ date: Math.floor(Date.now() / 1000), totalLiquidityUSD: response.body as unknown as number }];
  }
  return response.body;
}

export async function fetchStonePrice(): Promise<CoinGeckoCoin> {
  const response = await httpClient.sendRequest<CoinGeckoCoin>({
    method: HttpMethod.GET,
    url: `${COINGECKO_BASE}/coins/${STONE_COINGECKO_ID}`,
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

export function formatUsd(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}
