import { createAction, Property } from '@activepieces/pieces-framework';
import { searchPairs } from '../dexscreener-api';

export const searchPairsAction = createAction({
  name: 'search_pairs',
  displayName: 'Search Pairs',
  description: 'Search for DEX trading pairs by token name, symbol, or address.',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Token name, symbol, or contract address to search for (e.g. "WBTC", "SOL", or a contract address).',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Result Limit',
      description: 'Maximum number of pairs to return (default: 10, max: 30).',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const { query, limit } = context.propsValue;
    const pairs = await searchPairs(query);
    const maxResults = Math.min(limit ?? 10, 30);
    return {
      pairs: pairs.slice(0, maxResults),
      total: pairs.length,
    };
  },
});
