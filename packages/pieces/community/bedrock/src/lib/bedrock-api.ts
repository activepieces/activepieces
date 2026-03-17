import {
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

export const DEFILLAMA_BASE = 'https://api.llama.fi';
export const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
export const BEDROCK_SLUG = 'bedrock';
export const BR_COINGECKO_ID = 'bedrock-token';

export interface DefiLlamaProtocol {
  id: string;
  name: string;
  tvl: number;
  change_1h: number | null;
  change_1d: number | null;
  change_7d: number | null;
  currentChainTvls: Record<string, number>;
  chainTvls: Record<string, { tvl: Array<{ date: number; totalLiquidityUSD: number }> }>;
}

export interface CoinGeckoMarketData {
  current_price: { usd: number };
  market_cap: { usd: number };
  price_change_percentage_24h: number;
  total_volume: { usd: number };
  circulating_supply: number;
}

export interface CoinGeckoToken {
  id: string;
  symbol: string;
  name: string;
  market_data: CoinGeckoMarketData;
}

export async function fetchProtocol(): Promise<DefiLlamaProtocol> {
  const response = await httpClient.sendRequest<DefiLlamaProtocol>({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE}/protocol/${BEDROCK_SLUG}`,
  });
  return response.body;
}

export async function fetchBrToken(): Promise<CoinGeckoToken> {
  const response = await httpClient.sendRequest<CoinGeckoToken>({
    method: HttpMethod.GET,
    url: `${COINGECKO_BASE}/coins/${BR_COINGECKO_ID}`,
    queryParams: {
      localization: 'false',
      tickers: 'false',
      community_data: 'false',
      developer_data: 'false',
    },
  });
  return response.body;
}
