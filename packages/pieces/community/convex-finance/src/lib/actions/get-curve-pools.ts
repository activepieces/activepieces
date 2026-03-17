import { createAction, Property } from '@activepieces/pieces-framework';
import { convexRequest, CURVE_API_BASE_URL, NETWORK_OPTIONS } from '../common/convex-api';

export const getCurvePools = createAction({
  name: 'get_curve_pools',
  displayName: 'Get Curve Pools',
  description: 'List Curve Finance pools available for Convex boosting on a given network, including APY and TVL data',
  props: {
    network: Property.StaticDropdown({
      displayName: 'Network',
      description: 'Blockchain network to query',
      required: true,
      options: { options: NETWORK_OPTIONS },
    }),
  },
  async run(ctx) {
    const { network } = ctx.propsValue;
    const data = await convexRequest<any>(`${CURVE_API_BASE_URL}/getPools/${network}/main`);
    return data;
  },
});
