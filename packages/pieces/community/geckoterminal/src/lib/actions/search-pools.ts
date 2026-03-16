import { createAction, Property } from '@activepieces/pieces-framework';
import { geckoTerminalApiCall } from '../geckoterminal-api';

export const searchPoolsAction = createAction({
  name: 'search-pools',
  displayName: 'Search Pools',
  description: 'Search DEX pools by token name or contract address.',
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Token name, symbol, or contract address to search for.',
      required: true,
    }),
    network: Property.ShortText({
      displayName: 'Network (optional)',
      description:
        'Filter results by network (e.g. eth, solana, bsc). Leave empty for all networks.',
      required: false,
    }),
  },
  async run(context) {
    const { query, network } = context.propsValue;
    return await geckoTerminalApiCall('/search/pools', {
      query,
      network: network || undefined,
    });
  },
});
