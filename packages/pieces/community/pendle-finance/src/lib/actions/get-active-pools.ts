import { createAction, Property } from '@activepieces/pieces-framework';
import { pendleRequest, CHAIN_OPTIONS } from '../common/pendle-api';

export const getActivePools = createAction({
  name: 'get_active_pools',
  displayName: 'Get Active Pools',
  description: 'List active Pendle liquidity pools on a given chain with current yields and TVL',
  props: {
    chainId: Property.StaticDropdown({
      displayName: 'Chain',
      description: 'Blockchain network to query',
      required: true,
      options: { options: CHAIN_OPTIONS },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of pools to return (default: 10)',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(ctx) {
    const { chainId, limit } = ctx.propsValue;
    const effectiveLimit = limit ?? 10;
    const data = await pendleRequest<any>(
      `/v1/${chainId}/pools?limit=${effectiveLimit}`
    );
    return data;
  },
});
