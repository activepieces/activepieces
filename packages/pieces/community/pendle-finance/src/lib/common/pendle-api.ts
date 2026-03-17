import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const PENDLE_BASE_URL = 'https://api-v2.pendle.finance/core';
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

export async function pendleRequest<T>(endpoint: string): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url: `${PENDLE_BASE_URL}${endpoint}`,
    headers: { 'Accept': 'application/json' },
  });
  return response.body;
}

export async function coingeckoRequest<T>(endpoint: string): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url: `${COINGECKO_BASE_URL}${endpoint}`,
    headers: { 'Accept': 'application/json' },
  });
  return response.body;
}

export const CHAIN_OPTIONS = [
  { label: 'Ethereum', value: '1' },
  { label: 'Arbitrum', value: '42161' },
  { label: 'Polygon', value: '137' },
  { label: 'BNB Chain', value: '56' },
  { label: 'Optimism', value: '10' },
  { label: 'Base', value: '8453' },
  { label: 'Avalanche', value: '43114' },
  { label: 'Mantle', value: '5000' },
];
