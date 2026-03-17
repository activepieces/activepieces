import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const DEFILLAMA_BASE_URL = 'https://api.llama.fi';
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

const DEFILLAMA_SLUG = 'moonwell';
const COINGECKO_ID = 'moonwell-artemis';

export interface DefiLlamaProtocol {
  id: string;
  name: string;
  address: string | null;
  symbol: string;
  url: string;
  description: string;
  chain: string;
  logo: string;
  audits: string;
  audit_note: string | null;
  gecko_id: string | null;
  cmcId: string | null;
  category: string;
  chains: string[];
  module: string;
  twitter: string | null;
  forkedFrom: string[];
  oracles: string[];
  listedAt: number;
  methodology: string;
  slug: string;
  tvl: number;
  chainTvls: Record<string, number>;
  change_1h: number | null;
  change_1d: number | null;
  change_7d: number | null;
  tokenBreakdowns: Record<string, unknown>;
  mcap: number | null;
}

export interface DefiLlamaTvlHistory {
  date: number;
  totalLiquidityUSD: number;
}

export interface CoinGeckoPrice {
  id: string;
  symbol: string;
  name: string;
  market_data: {
    current_price: { usd: number };
    market_cap: { usd: number };
    total_volume: { usd: number };
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_30d: number;
    circulating_supply: number;
    total_supply: number | null;
    max_supply: number | null;
  };
}

export async function getProtocol(): Promise<DefiLlamaProtocol> {
  const response = await httpClient.sendRequest<DefiLlamaProtocol>({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE_URL}/protocol/${DEFILLAMA_SLUG}`,
  });
  return response.body;
}

export async function getTvlHistory(): Promise<DefiLlamaTvlHistory[]> {
  const protocol = await getProtocol();
  // DeFiLlama protocol endpoint includes tvlHistory as `tvl` array in some responses
  // Fallback: use the /tvl/<slug> endpoint to get current + historical via charts
  const response = await httpClient.sendRequest<DefiLlamaTvlHistory[]>({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE_URL}/v2/historicalChainTvl/${DEFILLAMA_SLUG}`,
  });
  return response.body;
}

export async function getTvlHistoryFromCharts(): Promise<DefiLlamaTvlHistory[]> {
  const response = await httpClient.sendRequest<{ tvl: DefiLlamaTvlHistory[] }>({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE_URL}/protocol/${DEFILLAMA_SLUG}`,
  });
  // The protocol response contains a `tvl` array with historical data
  const data = response.body as unknown as { tvl: DefiLlamaTvlHistory[] };
  return data.tvl || [];
}

export async function getWellTokenData(): Promise<CoinGeckoPrice> {
  const response = await httpClient.sendRequest<CoinGeckoPrice>({
    method: HttpMethod.GET,
    url: `${COINGECKO_BASE_URL}/coins/${COINGECKO_ID}`,
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
