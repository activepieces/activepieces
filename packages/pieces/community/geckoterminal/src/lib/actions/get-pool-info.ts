import { createAction, Property } from '@activepieces/pieces-framework';
import { geckoTerminalApiCall } from '../geckoterminal-api';

const NETWORKS = [
  { label: 'Ethereum', value: 'eth' },
  { label: 'Solana', value: 'solana' },
  { label: 'BNB Smart Chain', value: 'bsc' },
  { label: 'Base', value: 'base' },
  { label: 'Arbitrum', value: 'arbitrum' },
  { label: 'Polygon', value: 'polygon' },
  { label: 'Avalanche', value: 'avax' },
  { label: 'Optimism', value: 'optimism' },
];

export const getPoolInfoAction = createAction({
  name: 'get-pool-info',
  displayName: 'Get Pool Info',
  description: 'Get detailed information for a specific DEX pool by address.',
  props: {
    network: Property.StaticDropdown({
      displayName: 'Network',
      description: 'The blockchain network the pool is on.',
      required: true,
      options: {
        options: NETWORKS,
      },
    }),
    address: Property.ShortText({
      displayName: 'Pool Address',
      description: 'The contract address of the pool.',
      required: true,
    }),
  },
  async run(context) {
    const { network, address } = context.propsValue;
    return await geckoTerminalApiCall(`/networks/${network}/pools/${address}`);
  },
});
