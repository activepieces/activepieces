import { Property } from '@activepieces/pieces-framework';

export const chainIdDropdown = Property.StaticDropdown({
  displayName: 'Chain',
  required: true,
  options: {
    options: [
      { label: 'Ethereum', value: '1' },
      { label: 'Polygon', value: '137' },
      { label: 'BNB Chain', value: '56' },
      { label: 'Arbitrum', value: '42161' },
      { label: 'Optimism', value: '10' },
      { label: 'Base', value: '8453' },
      { label: 'Avalanche', value: '43114' },
    ],
  },
});
