import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';

export const BASE_URL = 'https://api.intotheblock.com/v1';

export const TIMEFRAME_OPTIONS = [
  { label: '1 Day', value: '1d' },
  { label: '1 Week', value: '1w' },
  { label: '1 Month', value: '1m' },
];

export const symbolProp = Property.ShortText({
  displayName: 'Asset Symbol',
  description: 'Crypto asset symbol (e.g. BTC, ETH, SOL)',
  required: true,
});

export const timeframeProp = Property.StaticDropdown({
  displayName: 'Timeframe',
  description: 'The time period for the data',
  required: true,
  options: {
    options: TIMEFRAME_OPTIONS,
  },
});

export async function makeIntoTheBlockRequest({
  apiKey,
  symbol,
  endpoint,
  params,
}: {
  apiKey: string;
  symbol: string;
  endpoint: string;
  params?: Record<string, string>;
}) {
  let url = `${BASE_URL}/asset/${symbol.toUpperCase()}/${endpoint}`;
  if (params && Object.keys(params).length > 0) {
    const query = new URLSearchParams(params).toString();
    url = `${url}?${query}`;
  }

  const response = await httpClient.sendRequest<Record<string, unknown>>({
    method: HttpMethod.GET,
    url,
    headers: {
      'x-api-key': apiKey,
    },
  });

  return response.body;
}
