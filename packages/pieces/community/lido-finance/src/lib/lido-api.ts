import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const LIDO_API_BASE = 'https://eth-api.lido.fi/v1';

export async function lidoApiGet<T = unknown>(endpoint: string): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url: `${LIDO_API_BASE}${endpoint}`,
    headers: {
      'Accept': 'application/json',
    },
  });
  return response.body;
}

export interface StethAprResponse {
  data: {
    aprs: Array<{
      timeUnix: number;
      apr: number;
    }>;
    smaApr: number;
  };
  meta: {
    symbol: string;
    address: string;
    chainId: number;
  };
}

export interface ProtocolStatsResponse {
  data: {
    lastOracleReport: {
      timeElapsed: number;
      preTotalEther: string;
      postTotalEther: string;
      aprBeforeFees: number;
      apr: number;
    };
    totalStakers: number;
    totalRewards: string;
    marketCap: number;
  };
  meta: {
    symbol: string;
    address: string;
    chainId: number;
  };
}

export interface AprSmaResponse {
  data: {
    smaApr: number;
    aprs: Array<{
      timeUnix: number;
      apr: number;
    }>;
  };
  meta: {
    symbol: string;
    address: string;
    chainId: number;
  };
}
