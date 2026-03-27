import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';

const BASE_URL = 'https://api.sardis.sh';

export async function sardisApiCall<T>(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: unknown,
  query?: Record<string, string>,
): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body,
    queryParams: query,
  });
  return response.body;
}

export const sardisCommon = {
  walletId: Property.ShortText({
    displayName: 'Wallet ID',
    description: 'Your Sardis wallet ID (starts with wal_)',
    required: true,
  }),

  token: Property.StaticDropdown({
    displayName: 'Token',
    description: 'Stablecoin to use for the transaction',
    required: false,
    defaultValue: 'USDC',
    options: {
      options: [
        { label: 'USDC', value: 'USDC' },
        { label: 'USDT', value: 'USDT' },
        { label: 'PYUSD', value: 'PYUSD' },
        { label: 'EURC', value: 'EURC' },
      ],
    },
  }),

  chain: Property.StaticDropdown({
    displayName: 'Chain',
    description: 'Blockchain network',
    required: false,
    defaultValue: 'base',
    options: {
      options: [
        { label: 'Base', value: 'base' },
        { label: 'Ethereum', value: 'ethereum' },
        { label: 'Polygon', value: 'polygon' },
        { label: 'Arbitrum', value: 'arbitrum' },
        { label: 'Optimism', value: 'optimism' },
      ],
    },
  }),
};
