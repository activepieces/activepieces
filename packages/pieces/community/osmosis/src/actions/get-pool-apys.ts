import { createAction, Property } from '@activepieces/pieces-framework';
import { getOsmosisPoolApys } from '../lib/osmosis-api';

export const getPoolApysAction = createAction({
  name: 'get_pool_apys',
  displayName: 'Get Pool APYs',
  description: 'Fetch Osmosis pool APYs from DeFiLlama Yields with an optional minimum APY filter to surface high-yield opportunities.',
  props: {
    minApy: Property.Number({
      displayName: 'Minimum APY (%)',
      description: 'Filter pools to only those with APY at or above this value. Leave blank to return all pools.',
      required: false,
    }),
  },
  async run(context) {
    const { minApy } = context.propsValue;
    const pools = await getOsmosisPoolApys(minApy ?? undefined);
    return {
      count: pools.length,
      minApyFilter: minApy ?? null,
      pools: pools.map((p: any) => ({
        pool: p.pool,
        symbol: p.symbol,
        tvlUsd: p.tvlUsd,
        apy: p.apy,
        apyBase: p.apyBase,
        apyReward: p.apyReward,
        chain: p.chain,
        rewardTokens: p.rewardTokens,
      })),
    };
  },
});
