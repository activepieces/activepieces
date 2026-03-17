import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const DEFILLAMA_PROTOCOL_URL = 'https://api.llama.fi/protocol/stakewise';
export const COINGECKO_SWISE_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=stakewise&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true';

export interface DefiLlamaProtocol {
  name: string;
  symbol: string;
  tvl: number;
  chains: string[];
  chainTvls: Record<string, number>;
  tvlHistory?: Array<{ date: number; totalLiquidityUSD: number }>;
  currentChainTvls: Record<string, number>;
}

export interface CoinGeckoSwisePrice {
  stakewise: {
    usd: number;
    usd_market_cap: number;
    usd_24h_vol: number;
    usd_24h_change: number;
  };
}

export interface ChainTvlEntry {
  chain: string;
  tvl: number;
  percentage: number;
}

export interface TvlHistoryEntry {
  date: string;
  tvl: number;
  changeFromStart: number;
}

export async function fetchDefiLlamaProtocol(): Promise<DefiLlamaProtocol> {
  const response = await httpClient.sendRequest<DefiLlamaProtocol>({
    method: HttpMethod.GET,
    url: DEFILLAMA_PROTOCOL_URL,
  });
  return response.body;
}

export async function fetchSwisePrice(): Promise<CoinGeckoSwisePrice> {
  const response = await httpClient.sendRequest<CoinGeckoSwisePrice>({
    method: HttpMethod.GET,
    url: COINGECKO_SWISE_URL,
  });
  return response.body;
}
