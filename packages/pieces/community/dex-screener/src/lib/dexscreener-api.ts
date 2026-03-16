import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.dexscreener.com';

export interface DexPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd?: string;
  txns?: Record<string, unknown>;
  volume?: Record<string, unknown>;
  priceChange?: Record<string, unknown>;
  liquidity?: {
    usd?: number;
    base: number;
    quote: number;
  };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
}

export interface TokenProfile {
  url: string;
  chainId: string;
  tokenAddress: string;
  icon?: string;
  header?: string;
  description?: string;
  links?: Array<{
    type?: string;
    label?: string;
    url: string;
  }>;
}

export interface BoostedToken {
  url: string;
  chainId: string;
  tokenAddress: string;
  amount?: number;
  totalAmount?: number;
  icon?: string;
  header?: string;
  description?: string;
  links?: Array<{
    type?: string;
    label?: string;
    url: string;
  }>;
}

export async function searchPairs(query: string): Promise<DexPair[]> {
  const response = await httpClient.sendRequest<{ pairs: DexPair[] | null }>({
    method: HttpMethod.GET,
    url: `${BASE_URL}/latest/dex/search`,
    queryParams: { q: query },
  });
  return response.body.pairs ?? [];
}

export async function getPairsByToken(
  chainId: string,
  tokenAddresses: string
): Promise<DexPair[]> {
  const response = await httpClient.sendRequest<DexPair[]>({
    method: HttpMethod.GET,
    url: `${BASE_URL}/tokens/v1/${chainId}/${tokenAddresses}`,
  });
  return response.body ?? [];
}

export async function getLatestTokenProfiles(): Promise<TokenProfile[]> {
  const response = await httpClient.sendRequest<TokenProfile[]>({
    method: HttpMethod.GET,
    url: `${BASE_URL}/token-profiles/latest/v1`,
  });
  return response.body ?? [];
}

export async function getLatestBoostedTokens(): Promise<BoostedToken[]> {
  const response = await httpClient.sendRequest<BoostedToken[]>({
    method: HttpMethod.GET,
    url: `${BASE_URL}/token-boosts/latest/v1`,
  });
  return response.body ?? [];
}

export async function getTopBoostedTokens(): Promise<BoostedToken[]> {
  const response = await httpClient.sendRequest<BoostedToken[]>({
    method: HttpMethod.GET,
    url: `${BASE_URL}/token-boosts/top/v1`,
  });
  return response.body ?? [];
}
