import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const QUOTE_API_BASE = 'https://interface.gateway.uniswap.org/v1';
const TOKEN_LIST_URL = 'https://tokens.uniswap.org/';
const SUBGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';

export type QuoteType = 'EXACT_INPUT' | 'EXACT_OUTPUT';

export interface QuoteRequest {
  tokenInAddress: string;
  tokenOutAddress: string;
  tokenInChainId: number;
  tokenOutChainId: number;
  amount: string;
  type: QuoteType;
}

export async function getQuote(params: QuoteRequest) {
  const response = await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: `${QUOTE_API_BASE}/quote`,
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://app.uniswap.org',
    },
    body: params,
  });
  return response.body;
}

export async function getTokenList() {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: TOKEN_LIST_URL,
  });
  return response.body;
}

export async function getPoolData(poolId: string) {
  const query = `
    {
      pool(id: "${poolId.toLowerCase()}") {
        id
        token0 {
          id
          symbol
          name
          decimals
        }
        token1 {
          id
          symbol
          name
          decimals
        }
        feeTier
        liquidity
        sqrtPrice
        tick
        token0Price
        token1Price
        volumeUSD
        txCount
        totalValueLockedUSD
        poolDayData(first: 7, orderBy: date, orderDirection: desc) {
          date
          volumeUSD
          tvlUSD
          feesUSD
        }
      }
    }
  `;

  const response = await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: SUBGRAPH_URL,
    headers: { 'Content-Type': 'application/json' },
    body: { query },
  });
  return response.body;
}

export async function getTopPools(limit: number = 10) {
  const query = `
    {
      pools(
        first: ${limit}
        orderBy: volumeUSD
        orderDirection: desc
      ) {
        id
        token0 {
          id
          symbol
          name
        }
        token1 {
          id
          symbol
          name
        }
        feeTier
        liquidity
        volumeUSD
        txCount
        totalValueLockedUSD
        token0Price
        token1Price
      }
    }
  `;

  const response = await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: SUBGRAPH_URL,
    headers: { 'Content-Type': 'application/json' },
    body: { query },
  });
  return response.body;
}

export async function getTokenPrice(tokenAddress: string) {
  // Derive USD price using the token's derived ETH price + ETH bundle price from subgraph
  const query = `
    {
      token(id: "${tokenAddress.toLowerCase()}") {
        id
        symbol
        name
        decimals
        derivedETH
        volumeUSD
        txCount
        totalValueLockedUSD
      }
      bundle(id: "1") {
        ethPriceUSD
      }
    }
  `;

  const response = await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: SUBGRAPH_URL,
    headers: { 'Content-Type': 'application/json' },
    body: { query },
  });

  const data = response.body as {
    data?: {
      token?: { derivedETH: string; symbol: string; name: string; decimals: string; volumeUSD: string; txCount: string; totalValueLockedUSD: string };
      bundle?: { ethPriceUSD: string };
    };
  };

  if (data?.data?.token && data?.data?.bundle) {
    const derivedETH = parseFloat(data.data.token.derivedETH);
    const ethPriceUSD = parseFloat(data.data.bundle.ethPriceUSD);
    const priceUSD = derivedETH * ethPriceUSD;

    return {
      data: {
        token: {
          ...data.data.token,
          priceUSD: priceUSD.toString(),
        },
        bundle: data.data.bundle,
      },
    };
  }

  return data;
}
