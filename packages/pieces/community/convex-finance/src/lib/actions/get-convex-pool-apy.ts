import { createAction } from '@activepieces/pieces-framework';
import { convexRequest, CONVEX_API_BASE_URL } from '../common/convex-api';

export const getConvexPoolApy = createAction({
  name: 'get_convex_pool_apy',
  displayName: 'Get Convex Pool APY',
  description: 'Fetch current APY data for all Convex-boosted Curve pools',
  props: {},
  async run() {
    const data = await convexRequest<any>(`${CONVEX_API_BASE_URL}/curve-apys`);
    return data;
  },
});
