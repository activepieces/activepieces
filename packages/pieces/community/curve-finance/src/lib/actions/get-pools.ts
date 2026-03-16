import { createAction, Property } from '@activepieces/pieces-framework';
import { curveRequest, CHAIN_OPTIONS } from '../curve-api';

export const getPools = createAction({
  name: 'get_pools',
  displayName: 'Get Pools',
  description: 'List all Curve Finance pools on a given chain with TVL, volume, and APY data',
  props: {
    chain: Property.StaticDropdown({
      displayName: 'Chain',
      description: 'Blockchain network to query',
      required: true,
      options: { options: CHAIN_OPTIONS },
    }),
    poolType: Property.StaticDropdown({
      displayName: 'Pool Type',
      description: 'Filter by pool type',
      required: false,
      options: {
        options: [
          { label: 'All Pools', value: 'all' },
          { label: 'Main Pools', value: 'main' },
          { label: 'Crypto Pools', value: 'crypto' },
          { label: 'Factory Pools', value: 'factory' },
        ],
      },
    }),
  },
  async run(ctx) {
    const { chain, poolType } = ctx.propsValue;
    const type = poolType || 'all';
    const data = await curveRequest<any>(`/getPools/${chain}/${type}`);
    return data;
  },
});
