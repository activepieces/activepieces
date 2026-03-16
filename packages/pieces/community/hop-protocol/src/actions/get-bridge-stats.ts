import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { HOP_API_URLS, HOP_PROJECT_ID } from '../lib/hop-api';

export const getBridgeStats = createAction({
  name: 'get_bridge_stats',
  displayName: 'Get Bridge Stats',
  description: 'Get Hop Protocol bridge pool statistics, APY, and liquidity data from DeFiLlama Yields',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: HOP_API_URLS.YIELDS_POOLS,
    });

    const allPools: Array<Record<string, unknown>> = response.body?.data ?? [];
    const hopPools = allPools.filter(
      (pool) => pool['project'] === HOP_PROJECT_ID
    );

    return {
      count: hopPools.length,
      pools: hopPools,
    };
  },
});
