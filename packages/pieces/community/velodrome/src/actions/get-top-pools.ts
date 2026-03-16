import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchUrl } from '../lib/velodrome-api';

export const getTopPools = createAction({
  name: 'get_top_pools',
  displayName: 'Get Top Pools',
  description: 'Get top Velodrome Finance liquidity pools by TVL',
  auth: undefined,
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of pools to return',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const limit = context.propsValue.limit ?? 20;
    const data = await fetchUrl('https://yields.llama.fi/pools');

    const pools = (data.data as any[])
      .filter((p: any) => p.project === 'velodrome-v2')
      .sort((a: any, b: any) => (b.tvlUsd || 0) - (a.tvlUsd || 0))
      .slice(0, limit)
      .map((p: any) => ({
        pool: p.pool,
        symbol: p.symbol,
        tvlUsd: p.tvlUsd,
        apy: p.apy,
        chain: p.chain,
        project: p.project,
      }));

    return { pools, total: pools.length };
  },
});
