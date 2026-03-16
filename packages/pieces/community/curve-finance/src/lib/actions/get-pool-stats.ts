import { createAction, Property } from '@activepieces/pieces-framework';
import { curveRequest, CHAIN_OPTIONS } from '../curve-api';

export const getPoolStats = createAction({
  name: 'get_pool_stats',
  displayName: 'Get Pool Stats',
  description: 'Get detailed statistics for a specific Curve Finance pool',
  props: {
    chain: Property.StaticDropdown({
      displayName: 'Chain',
      required: true,
      options: { options: CHAIN_OPTIONS },
    }),
    poolAddress: Property.ShortText({
      displayName: 'Pool Address',
      description: 'Contract address of the Curve pool',
      required: true,
    }),
  },
  async run(ctx) {
    const { chain, poolAddress } = ctx.propsValue;
    const data = await curveRequest<any>(`/getPool/${chain}/${poolAddress}`);
    return data;
  },
});
