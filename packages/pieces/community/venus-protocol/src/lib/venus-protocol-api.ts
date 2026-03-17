import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const DEFILLAMA_BASE_URL = 'https://api.llama.fi';
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
const DEFILLAMA_SLUG = 'venus';
const COINGECKO_ID = 'venus';

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
  gecko_id: string;
  cmcId: string;
  category: string;
  chains: string[];
  module: string;
  twitter: string;
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

export interface DefiLlamaTvlHistoryPoint {
  date: number;
  totalLiquidityUSD: number;
}

export interface CoinGeckoTokenData {
  id: string;
  symbol: string;
  name: string;
  market_data: {
    current_price: { usd: number };
    market_cap: { usd: number };
    total_volume: { usd: number };
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    circulating_supply: number;
    total_supply: number;
    max_supply: number | null;
    ath: { usd: number };
    ath_date: { usd: string };
  };
}

export async function getProtocolData(): Promise<DefiLlamaProtocol> {
  const response = await httpClient.sendRequest<DefiLlamaProtocol>({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE_URL}/protocol/${DEFILLAMA_SLUG}`,
  });
  return response.body;
}

export async function getTvlHistory(): Promise<DefiLlamaTvlHistoryPoint[]> {
  const response = await httpClient.sendRequest<{ tvl: DefiLlamaTvlHistoryPoint[] }>({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE_URL}/protocol/${DEFILLAMA_SLUG}`,
  });
  return response.body.tvl;
}

export async function getXvsTokenData(): Promise<CoinGeckoTokenData> {
  const response = await httpClient.sendRequest<CoinGeckoTokenData>({
    method: HttpMethod.GET,
    url: `${COINGECKO_BASE_URL}/coins/${COINGECKO_ID}`,
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
