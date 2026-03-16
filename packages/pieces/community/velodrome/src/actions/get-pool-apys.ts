import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchUrl } from '../lib/velodrome-api';

export const getPoolApys = createAction({
  name: 'get_pool_apys',
  displayName: 'Get Pool APYs',
  description: 'Get APY data for Velodrome Finance liquidity pools',
  auth: undefined,
  props: {
    minApy: Property.Number({
      displayName: 'Minimum APY (%)',
      description: 'Filter pools with APY above this threshold',
      required: false,
      defaultValue: 0,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of pools to return',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const minApy = context.propsValue.minApy ?? 0;
    const limit = context.propsValue.limit ?? 20;
    const data = await fetchUrl('https://yields.llama.fi/pools');

    const pools = (data.data as any[])
      .filter((p: any) => p.project === 'velodrome-v2' && (p.apy || 0) >= minApy)
      .sort((a: any, b: any) => (b.apy || 0) - (a.apy || 0))
      .slice(0, limit)
      .map((p: any) => ({
        pool: p.pool,
        symbol: p.symbol,
        apy: p.apy,
        apyBase: p.apyBase,
        apyReward: p.apyReward,
        tvlUsd: p.tvlUsd,
        chain: p.chain,
      }));

    return {
      pools,
      total: pools.length,
      minApyFilter: minApy,
      source: 'DeFiLlama',
    };
  },
});
