import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const DEFILLAMA_PROTOCOL_URL = 'https://api.llama.fi/protocol/stader';
export const COINGECKO_SD_PRICE_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=staderlabs&vs_currencies=usd&include_market_cap=true&include_24hr_change=true';

export interface DefiLlamaProtocolResponse {
  name: string;
  symbol: string;
  description: string;
  logo: string;
  url: string;
  tvl: number;
  currentChainTvls: Record<string, number>;
  chainTvls: Record<
    string,
    {
      tvl: Array<{ date: number; totalLiquidityUSD: number }>;
      tokensInUsd?: Array<{ date: number; tokens: Record<string, number> }>;
    }
  >;
  tokens: Array<{ date: number; tokens: Record<string, number> }>;
  tokensInUsd: Array<{ date: number; tokens: Record<string, number> }>;
  tvlBreakdowns?: Record<string, number>;
  raises?: unknown[];
  metrics?: Record<string, unknown>;
  historicalChainTvls?: Record<string, unknown>;
  hallmarks?: Array<[number, string]>;
}

export interface CoinGeckoPriceResponse {
  staderlabs: {
    usd: number;
    usd_market_cap: number;
    usd_24h_change: number;
  };
}

export interface ChainBreakdownEntry {
  chain: string;
  tvlUsd: number;
  percentage: number;
}

export interface TvlHistoryEntry {
  date: string;
  tvlUsd: number;
  changeFromBaseline: number;
}

export async function fetchProtocolData(): Promise<DefiLlamaProtocolResponse> {
  const response = await httpClient.sendRequest<DefiLlamaProtocolResponse>({
    method: HttpMethod.GET,
    url: DEFILLAMA_PROTOCOL_URL,
  });
  return response.body;
}

export async function fetchSdPrice(): Promise<CoinGeckoPriceResponse> {
  const response = await httpClient.sendRequest<CoinGeckoPriceResponse>({
    method: HttpMethod.GET,
    url: COINGECKO_SD_PRICE_URL,
  });
  return response.body;
}

export function formatUsd(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}
