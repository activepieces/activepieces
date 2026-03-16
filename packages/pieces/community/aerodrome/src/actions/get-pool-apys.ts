import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { AERODROME_API, AERODROME_PROJECT_ID } from '../lib/aerodrome-api';

export const getPoolApys = createAction({
  name: 'get_pool_apys',
  displayName: 'Get Pool APYs',
  description: 'Get Aerodrome v2 pool APYs with optional minimum APY filter',
  props: {
    minApy: Property.Number({
      displayName: 'Minimum APY (%)',
      description: 'Only return pools with APY above this threshold (optional)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of pools to return (default: 20)',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const { minApy, limit = 20 } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: AERODROME_API.DEFILLAMA_YIELDS,
    });

    const allPools: any[] = response.body?.data ?? [];
    let aerodromePools = allPools.filter(
      (pool: any) => pool.project === AERODROME_PROJECT_ID,
    );

    if (minApy !== undefined && minApy !== null) {
      aerodromePools = aerodromePools.filter(
        (pool: any) => (pool.apy ?? 0) >= minApy,
      );
    }

    aerodromePools = aerodromePools
      .sort((a: any, b: any) => (b.apy ?? 0) - (a.apy ?? 0))
      .slice(0, limit)
      .map((pool: any) => ({
        pool: pool.pool,
        symbol: pool.symbol,
        apy: pool.apy,
        apyBase: pool.apyBase,
        apyReward: pool.apyReward,
        tvlUsd: pool.tvlUsd,
        rewardTokens: pool.rewardTokens,
        chain: pool.chain,
      }));

    return {
      count: aerodromePools.length,
      minApyFilter: minApy ?? null,
      pools: aerodromePools,
    };
  },
});
