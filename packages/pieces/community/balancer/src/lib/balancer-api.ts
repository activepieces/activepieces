import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const BALANCER_GRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2';

export interface BalancerPool {
  id: string;
  name: string;
  symbol: string;
  poolType: string;
  swapFee: string;
  totalLiquidity: string;
  totalSwapVolume: string;
  totalSwapFee: string;
  tokens?: BalancerPoolToken[];
}

export interface BalancerPoolToken {
  address: string;
  symbol: string;
  name: string;
  decimals: string;
  weight: string | null;
  balance: string;
}

export interface BalancerProtocolData {
  totalLiquidity: string;
  totalSwapVolume: string;
  totalSwapFee: string;
  poolCount: string;
}

export async function balancerQuery<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await httpClient.sendRequest<{
    data: T;
    errors?: unknown[];
  }>({
    method: HttpMethod.POST,
    url: BALANCER_GRAPH_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      query,
      variables: variables ?? {},
    },
  });

  if (response.body.errors && response.body.errors.length > 0) {
    throw new Error(
      'Balancer GraphQL error: ' + JSON.stringify(response.body.errors)
    );
  }

  return response.body.data;
}
