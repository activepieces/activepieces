import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const CHAIN_URLS: Record<string, string> = {
  '1': 'https://api.0x.org',
  '137': 'https://polygon.api.0x.org',
  '56': 'https://bsc.api.0x.org',
  '42161': 'https://arbitrum.api.0x.org',
  '10': 'https://optimism.api.0x.org',
  '8453': 'https://base.api.0x.org',
  '43114': 'https://avalanche.api.0x.org',
};

export const CHAIN_OPTIONS = [
  { label: 'Ethereum', value: '1' },
  { label: 'Polygon', value: '137' },
  { label: 'BNB Chain', value: '56' },
  { label: 'Arbitrum', value: '42161' },
  { label: 'Optimism', value: '10' },
  { label: 'Base', value: '8453' },
  { label: 'Avalanche', value: '43114' },
];

export async function zeroExRequest<T>(
  apiKey: string,
  chainId: string,
  path: string,
  params: Record<string, string | undefined>
): Promise<T> {
  const baseUrl = CHAIN_URLS[chainId];
  if (!baseUrl) {
    throw new Error(`Unsupported chainId: ${chainId}`);
  }

  const filteredParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') {
      filteredParams[k] = v;
    }
  }

  const query = new URLSearchParams(filteredParams).toString();
  const url = `${baseUrl}${path}${query ? '?' + query : ''}`;

  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.GET,
    url,
    headers: {
      '0x-api-key': apiKey,
    },
  });

  return response.body;
}
