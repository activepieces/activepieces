import { createAction, Property } from '@activepieces/pieces-framework';
import { balancerQuery, BalancerPool } from '../balancer-api';

const GET_SWAP_VOLUME_QUERY = `
  query GetSwapVolume($first: Int!, $timestamp24hAgo: Int!) {
    pools(
      first: $first
      orderBy: totalSwapVolume
      orderDirection: desc
      where: { totalLiquidity_gt: "0" }
    ) {
      id
      name
      symbol
      poolType
      totalLiquidity
      totalSwapVolume
    }
    poolSnapshots(
      first: $first
      orderBy: timestamp
      orderDirection: desc
      where: { timestamp_gte: $timestamp24hAgo }
    ) {
      pool { id }
      swapVolume
      timestamp
    }
  }
`;

interface PoolSnapshot {
  pool: { id: string };
  swapVolume: string;
  timestamp: string;
}

export const getSwapVolumeAction = createAction({
  name: 'get_swap_volume',
  displayName: 'Get 24h Swap Volume',
  description: 'Get the 24-hour swap volume for the top Balancer pools.',
  props: {
    limit: Property.Number({
      displayName: 'Number of Pools',
      description: 'How many top pools to include.',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const limit = Math.min(context.propsValue.limit ?? 10, 50);
    const now = Math.floor(Date.now() / 1000);
    const timestamp24hAgo = now - 86400;

    const data = await balancerQuery<{
      pools: BalancerPool[];
      poolSnapshots: PoolSnapshot[];
    }>(GET_SWAP_VOLUME_QUERY, { first: limit, timestamp24hAgo });

    // Build a map of max 24h volume from snapshots
    const snapshotVolumeMap: Record<string, number> = {};
    for (const snap of data.poolSnapshots ?? []) {
      const poolId = snap.pool.id;
      const vol = parseFloat(snap.swapVolume);
      if (!snapshotVolumeMap[poolId] || vol > snapshotVolumeMap[poolId]) {
        snapshotVolumeMap[poolId] = vol;
      }
    }

    return {
      generatedAt: new Date().toISOString(),
      pools: data.pools.map((pool) => {
        const volume24h = snapshotVolumeMap[pool.id] ?? null;
        return {
          id: pool.id,
          name: pool.name || pool.symbol,
          symbol: pool.symbol,
          poolType: pool.poolType,
          totalLiquidityUSD: parseFloat(pool.totalLiquidity).toLocaleString(
            'en-US',
            { style: 'currency', currency: 'USD' }
          ),
          totalSwapVolume: pool.totalSwapVolume,
          volume24hUSD:
            volume24h !== null
              ? volume24h.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                })
              : 'N/A (no snapshot in period)',
          volume24hRaw: volume24h,
        };
      }),
    };
  },
});
