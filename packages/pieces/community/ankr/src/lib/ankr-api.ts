import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const DEFILLAMA_ANKR_URL = 'https://api.llama.fi/protocol/ankr';
export const COINGECKO_ANKR_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=ankr-network&vs_currencies=usd&include_market_cap=true&include_24hr_change=true';

export interface DefiLlamaChainTvl {
  [chain: string]: number;
}

export interface DefiLlamaTvlEntry {
  date: number;
  totalLiquidityUSD: number;
}

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
  chainTvls: DefiLlamaChainTvl;
  change_1h: number;
  change_1d: number;
  change_7d: number;
  tokenBreakdowns: Record<string, unknown>;
  mcap: number;
  currentChainTvls: DefiLlamaChainTvl;
  historicalChainTvls: Record<string, { tvl: DefiLlamaTvlEntry[] }>;
  tokensInUsd: DefiLlamaTvlEntry[];
  tokens: DefiLlamaTvlEntry[];
  tvlData: DefiLlamaTvlEntry[];
}

export interface CoinGeckoPriceData {
  'ankr-network': {
    usd: number;
    usd_market_cap: number;
    usd_24h_change: number;
  };
}

export async function fetchAnkrProtocol(): Promise<DefiLlamaProtocol> {
  const response = await httpClient.sendRequest<DefiLlamaProtocol>({
    method: HttpMethod.GET,
    url: DEFILLAMA_ANKR_URL,
  });
  return response.body;
}

export async function fetchAnkrPrice(): Promise<CoinGeckoPriceData> {
  const response = await httpClient.sendRequest<CoinGeckoPriceData>({
    method: HttpMethod.GET,
    url: COINGECKO_ANKR_URL,
  });
  return response.body;
}
