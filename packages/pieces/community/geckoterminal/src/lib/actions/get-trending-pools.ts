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

export const getTrendingPoolsAction = createAction({
  name: 'get-trending-pools',
  displayName: 'Get Trending Pools',
  description: 'Get trending DEX pools on a specific network.',
  props: {
    network: Property.StaticDropdown({
      displayName: 'Network',
      description: 'The blockchain network to query.',
      required: true,
      options: {
        options: NETWORKS,
      },
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for pagination.',
      required: false,
      defaultValue: 1,
    }),
  },
  async run(context) {
    const { network, page } = context.propsValue;
    return await geckoTerminalApiCall(`/networks/${network}/trending_pools`, {
      page: page ?? 1,
    });
  },
});
