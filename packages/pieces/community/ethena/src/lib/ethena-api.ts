import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const DEFILLAMA_SLUG = 'ethena';
const COINGECKO_ID = 'ethena';

export interface DefiLlamaProtocol {
  id: string;
  name: string;
  tvl: number;
  change_1h: number | null;
  change_1d: number | null;
  change_7d: number | null;
  chainTvls: Record<string, number>;
}

export interface DefiLlamaTvlPoint {
  date: number;
  totalLiquidityUSD: number;
}

export interface CoinGeckoPrice {
  ethena: {
    usd: number;
    usd_market_cap: number;
    usd_24h_vol: number;
    usd_24h_change: number;
  };
}

export async function getProtocolData(): Promise<DefiLlamaProtocol> {
  const response = await httpClient.sendRequest<DefiLlamaProtocol>({
    method: HttpMethod.GET,
    url: `https://api.llama.fi/protocol/${DEFILLAMA_SLUG}`,
  });
  return response.body;
}

export async function getTvlHistory(): Promise<DefiLlamaTvlPoint[]> {
  const response = await httpClient.sendRequest<DefiLlamaTvlPoint[]>({
    method: HttpMethod.GET,
    url: `https://api.llama.fi/tvl/${DEFILLAMA_SLUG}/history`,
  });
  return response.body;
}

export async function getCurrentTvl(): Promise<number> {
  const response = await httpClient.sendRequest<number>({
    method: HttpMethod.GET,
    url: `https://api.llama.fi/tvl/${DEFILLAMA_SLUG}`,
  });
  return response.body;
}

export async function getEnaPrice(): Promise<CoinGeckoPrice> {
  const response = await httpClient.sendRequest<CoinGeckoPrice>({
    method: HttpMethod.GET,
    url: `https://api.coingecko.com/api/v3/simple/price`,
    queryParams: {
      ids: COINGECKO_ID,
      vs_currencies: 'usd',
      include_market_cap: 'true',
      include_24hr_vol: 'true',
      include_24hr_change: 'true',
    },
  });
  return response.body;
}
