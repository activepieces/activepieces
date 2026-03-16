import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchPositionLine } from '../raydium-api';

export const getPoolInfo = createAction({
  name: 'get-pool-info',
  displayName: 'Get Concentrated Liquidity Pool Info',
  description: 'Retrieve concentrated liquidity position line data for a specific Raydium CLMM (AMM V3) pool.',
  auth: undefined,
  props: {
    poolId: Property.ShortText({
      displayName: 'Pool ID',
      description: 'The CLMM pool ID to fetch position line data for.',
      required: true,
    }),
  },
  async run(context) {
    const { poolId } = context.propsValue;
    const data = await fetchPositionLine(poolId);

    return {
      poolId,
      data,
    };
  },
});
