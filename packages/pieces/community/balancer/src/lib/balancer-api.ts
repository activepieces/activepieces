import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const DEFILLAMA_BASE_URL = 'https://api.llama.fi';
export const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
export const BALANCER_PROTOCOL_SLUG = 'balancer';
export const BALANCER_COINGECKO_ID = 'balancer';

export interface DefiLlamaProtocol {
  tvl: number; change_1h: number | null; change_1d: number | null; change_7d: number | null;
  chainTvls: Record<string, number>; tvlList?: Array<{date: number; totalLiquidityUSD: number}>;
  name: string; symbol: string;
}

export interface CoinGeckoPrice {
  market_data: {current_price: {usd: number}; market_cap: {usd: number}; price_change_percentage_24h: number; total_volume: {usd: number}; circulating_supply: number};
  name: string; symbol: string; last_updated: string;
}

export async function getProtocolData(): Promise<DefiLlamaProtocol> {
  const response = await httpClient.sendRequest<DefiLlamaProtocol>({
    method: HttpMethod.GET, url: `${DEFILLAMA_BASE_URL}/protocol/${BALANCER_PROTOCOL_SLUG}`,
  });
  return response.body;
}

export async function getBalTokenData(): Promise<CoinGeckoPrice> {
  const response = await httpClient.sendRequest<CoinGeckoPrice>({
    method: HttpMethod.GET, url: `${COINGECKO_BASE_URL}/coins/${BALANCER_COINGECKO_ID}`,
    queryParams: {localization: 'false', tickers: 'false', market_data: 'true', community_data: 'false', developer_data: 'false', sparkline: 'false'},
  });
  return response.body;
}

export function formatUSD(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

export function formatChange(change: number | null): string {
  if (change === null || change === undefined) return 'N/A';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}
