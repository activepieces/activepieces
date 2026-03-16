import { createAction, Property } from '@activepieces/pieces-framework';
import { getTopPools } from '../uniswap-api';

export const getTopPoolsAction = createAction({
  name: 'get_top_pools',
  displayName: 'Get Top Pools',
  description:
    'Get the top Uniswap v3 pools ranked by trading volume, with TVL and fee data.',
  props: {
    limit: Property.Number({
      displayName: 'Number of Pools',
      description: 'How many top pools to return (max 100)',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const limit = Math.min(Number(context.propsValue.limit ?? 10), 100);
    const result = await getTopPools(limit) as {
      data?: {
        pools?: Array<{
          id: string;
          token0: { symbol: string };
          token1: { symbol: string };
          feeTier: string;
          volumeUSD: string;
          totalValueLockedUSD: string;
          txCount: string;
          token0Price: string;
          token1Price: string;
        }>;
      };
    };

    const pools = result?.data?.pools ?? [];

    const formatted = pools.map((pool, index) => ({
      rank: index + 1,
      id: pool.id,
      pair: `${pool.token0.symbol}/${pool.token1.symbol}`,
      feeTier: `${Number(pool.feeTier) / 10000}%`,
      volumeUSD: `$${parseFloat(pool.volumeUSD).toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      tvlUSD: `$${parseFloat(pool.totalValueLockedUSD).toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      txCount: pool.txCount,
      token0Price: pool.token0Price,
      token1Price: pool.token1Price,
    }));

    return {
      count: formatted.length,
      pools: formatted,
      raw: result?.data?.pools,
    };
  },
});
