import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchPairs } from '../raydium-api';

export const getPairs = createAction({
  name: 'get-pairs',
  displayName: 'Get Trading Pairs',
  description: 'Retrieve all Raydium trading pairs with price, volume, liquidity, and APR data.',
  auth: undefined,
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of pairs to return. Leave empty to return all pairs.',
      required: false,
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Sort pairs by this field.',
      required: false,
      options: {
        options: [
          { label: 'Liquidity', value: 'liquidity' },
          { label: '24h Volume', value: 'volume24h' },
          { label: '24h Fee', value: 'fee24h' },
          { label: '24h APR', value: 'apr24h' },
          { label: '7d APR', value: 'apr7d' },
        ],
      },
      defaultValue: 'liquidity',
    }),
  },
  async run(context) {
    const { limit, sortBy } = context.propsValue;
    let pairs = await fetchPairs();

    if (sortBy) {
      pairs = pairs.sort((a, b) => {
        const valA = (a[sortBy] as number) || 0;
        const valB = (b[sortBy] as number) || 0;
        return valB - valA;
      });
    }

    if (limit && limit > 0) {
      pairs = pairs.slice(0, limit);
    }

    return {
      count: pairs.length,
      pairs,
    };
  },
});
