import { createAction, Property } from '@activepieces/pieces-framework';
import { curveRequest, CHAIN_OPTIONS } from '../curve-api';

export const getGaugeData = createAction({
  name: 'get_gauge_data',
  displayName: 'Get Gauge Data',
  description: 'Get CRV liquidity mining gauge data for a Curve pool including APR and gauge weight',
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
    const data = await curveRequest<any>(`/getGaugeRewards/${chain}/${poolAddress}`);
    return data;
  },
});
