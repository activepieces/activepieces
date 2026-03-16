import {
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

export const RAYDIUM_API_BASE = 'https://api.raydium.io/v2';

export interface RaydiumProtocolInfo {
  tvl: number;
  volume24h: number;
  volume24hQuote: number;
  fee24h: number;
  fee24hQuote: number;
  totalVolume: number;
  totalVolumeFee: number;
  totalFee: number;
  totalFeeQuote: number;
  stakedRay: number;
  burnedRay: number;
  [key: string]: unknown;
}

export interface RaydiumPair {
  name: string;
  ammId: string;
  lpMint: string;
  market: string;
  liquidity: number;
  volume7d: number;
  volume7dQuote: number;
  fee7d: number;
  fee7dQuote: number;
  volume24h: number;
  volume24hQuote: number;
  fee24h: number;
  fee24hQuote: number;
  price: number;
  lpPrice: number;
  tokenAmountCoin: number;
  tokenAmountPc: number;
  tokenAmountLp: number;
  apr24h: number;
  apr7d: number;
  apr30d: number;
  [key: string]: unknown;
}

export interface RaydiumPool {
  id: string;
  baseMint: string;
  quoteMint: string;
  lpMint: string;
  baseDecimals: number;
  quoteDecimals: number;
  lpDecimals: number;
  version: number;
  programId: string;
  [key: string]: unknown;
}

export async function fetchProtocolInfo(): Promise<RaydiumProtocolInfo> {
  const response = await httpClient.sendRequest<RaydiumProtocolInfo>({
    method: HttpMethod.GET,
    url: `${RAYDIUM_API_BASE}/main/info`,
  });
  return response.body;
}

export async function fetchPairs(): Promise<RaydiumPair[]> {
  const response = await httpClient.sendRequest<RaydiumPair[]>({
    method: HttpMethod.GET,
    url: `${RAYDIUM_API_BASE}/main/pairs`,
  });
  return response.body;
}

export async function fetchPools(): Promise<{ official: RaydiumPool[]; unOfficial: RaydiumPool[] }> {
  const response = await httpClient.sendRequest<{ official: RaydiumPool[]; unOfficial: RaydiumPool[] }>({
    method: HttpMethod.GET,
    url: `${RAYDIUM_API_BASE}/main/pools`,
  });
  return response.body;
}

export async function fetchPositionLine(poolId: string): Promise<unknown> {
  const response = await httpClient.sendRequest<unknown>({
    method: HttpMethod.GET,
    url: `${RAYDIUM_API_BASE}/ammV3/positionLine`,
    queryParams: {
      pool_id: poolId,
    },
  });
  return response.body;
}
