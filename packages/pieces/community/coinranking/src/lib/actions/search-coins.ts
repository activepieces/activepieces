import { createAction, Property } from '@activepieces/pieces-framework';
import { coinrankingAuth } from '../../index';
import { coinrankingRequest } from '../coinranking-api';

export const searchCoins = createAction({
  name: 'search_coins',
  displayName: 'Search Coins',
  description: 'Search for coins by name or symbol and return matching results.',
  auth: coinrankingAuth,
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Name or symbol to search for (e.g. "Bitcoin" or "BTC")',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return (max 100)',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const { query, limit } = context.propsValue;
    return coinrankingRequest(context.auth, '/search-suggestions', {
      query,
      limit,
    });
  },
});
