import { createAction } from '@activepieces/pieces-framework';
import { fetchBridgePools } from '../lib/stargate-api';

export const getBridgePools = createAction({
  name: 'get_bridge_pools',
  displayName: 'Get Bridge Pools',
  description: 'Get all active Stargate Finance liquidity pools with APY and TVL data from DeFiLlama Yields.',
  props: {},
  async run() {
    return await fetchBridgePools();
  },
});
