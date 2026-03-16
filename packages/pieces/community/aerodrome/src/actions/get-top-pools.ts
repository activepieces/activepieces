import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { AERODROME_API, AERODROME_PROJECT_ID } from '../lib/aerodrome-api';

export const getTopPools = createAction({
  name: 'get_top_pools',
  displayName: 'Get Top Pools',
  description: 'Get top Aerodrome v2 liquidity pools sorted by TVL',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of pools to return (default: 10)',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const limit = context.propsValue.limit ?? 10;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: AERODROME_API.DEFILLAMA_YIELDS,
    });

    const allPools: any[] = response.body?.data ?? [];
    const aerodromePools = allPools
      .filter((pool: any) => pool.project === AERODROME_PROJECT_ID)
      .sort((a: any, b: any) => (b.tvlUsd ?? 0) - (a.tvlUsd ?? 0))
      .slice(0, limit);

    return {
      count: aerodromePools.length,
      pools: aerodromePools,
    };
  },
});
