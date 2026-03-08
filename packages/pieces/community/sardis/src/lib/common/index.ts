import { Property } from '@activepieces/pieces-framework';

export const sardisCommon = {
  baseUrl: 'https://api.sardis.sh/api/v2',

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
