import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchPools } from '../raydium-api';

export const getPools = createAction({
  name: 'get-pools',
  displayName: 'Get Liquidity Pools',
  description: 'Retrieve Raydium liquidity pool details including official and community pools.',
  auth: undefined,
  props: {
    poolType: Property.StaticDropdown({
      displayName: 'Pool Type',
      description: 'Filter by pool type.',
      required: false,
      options: {
        options: [
          { label: 'All Pools', value: 'all' },
          { label: 'Official Only', value: 'official' },
          { label: 'Unofficial Only', value: 'unOfficial' },
        ],
      },
      defaultValue: 'all',
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of pools to return per category.',
      required: false,
    }),
  },
  async run(context) {
    const { poolType, limit } = context.propsValue;
    const data = await fetchPools();

    let official = data.official || [];
    let unOfficial = data.unOfficial || [];

    if (limit && limit > 0) {
      official = official.slice(0, limit);
      unOfficial = unOfficial.slice(0, limit);
    }

    if (poolType === 'official') {
      return { count: official.length, pools: official };
    } else if (poolType === 'unOfficial') {
      return { count: unOfficial.length, pools: unOfficial };
    }

    return {
      officialCount: official.length,
      unofficialCount: unOfficial.length,
      official,
      unOfficial,
    };
  },
});
