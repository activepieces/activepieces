import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const DEFILLAMA_BASE = 'https://api.llama.fi';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export interface DefiLlamaProtocol {
  id: string;
  name: string;
  symbol: string;
  description: string;
  category: string;
  chains: string[];
  url: string;
  twitter: string;
  gecko_id: string;
  currentChainTvls: Record<string, number>;
  tvl: Array<{ date: number; totalLiquidityUSD: number }>;
  chainTvls: Record<string, { tvl: Array<{ date: number; totalLiquidityUSD: number }> }>;
}

export interface CoinGeckoMarketData {
  current_price: Record<string, number>;
  market_cap: Record<string, number>;
  total_volume: Record<string, number>;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  circulating_supply: number;
  ath: Record<string, number>;
  atl: Record<string, number>;
}

export interface CoinGeckoCoin {
  id: string;
  symbol: string;
  name: string;
  market_data: CoinGeckoMarketData;
  last_updated: string;
}

export async function fetchProtocol(): Promise<DefiLlamaProtocol> {
  const response = await httpClient.sendRequest<DefiLlamaProtocol>({
    method: HttpMethod.GET,
    url: `${DEFILLAMA_BASE}/protocol/rocket-pool`,
    headers: { Accept: 'application/json' },
  });
  return response.body;
}

export async function fetchRethCoin(): Promise<CoinGeckoCoin> {
  const response = await httpClient.sendRequest<CoinGeckoCoin>({
    method: HttpMethod.GET,
    url: `${COINGECKO_BASE}/coins/rocket-pool-eth?localization=false&tickers=false&community_data=false&developer_data=false`,
    headers: { Accept: 'application/json' },
  });
  return response.body;
}
