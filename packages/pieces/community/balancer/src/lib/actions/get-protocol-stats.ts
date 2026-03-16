import { createAction } from '@activepieces/pieces-framework';
import { balancerQuery, BalancerProtocolData } from '../balancer-api';

const GET_PROTOCOL_STATS_QUERY = `
  query GetProtocolStats {
    balancers(first: 1) {
      totalLiquidity
      totalSwapVolume
      totalSwapFee
      poolCount
    }
  }
`;

export const getProtocolStatsAction = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Get protocol-wide statistics for Balancer: total liquidity, swap volume, fees, and pool count.',
  props: {},
  async run() {
    const data = await balancerQuery<{ balancers: BalancerProtocolData[] }>(
      GET_PROTOCOL_STATS_QUERY
    );

    if (!data.balancers || data.balancers.length === 0) {
      throw new Error('No protocol data returned from Balancer subgraph');
    }

    const stats = data.balancers[0];
    const totalLiquidity = parseFloat(stats.totalLiquidity);
    const totalSwapVolume = parseFloat(stats.totalSwapVolume);
    const totalSwapFee = parseFloat(stats.totalSwapFee);

    return {
      totalLiquidityUSD: totalLiquidity.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      }),
      totalSwapVolumeUSD: totalSwapVolume.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      }),
      totalSwapFeeUSD: totalSwapFee.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      }),
      poolCount: parseInt(stats.poolCount, 10),
      raw: {
        totalLiquidity: stats.totalLiquidity,
        totalSwapVolume: stats.totalSwapVolume,
        totalSwapFee: stats.totalSwapFee,
        poolCount: stats.poolCount,
      },
    };
  },
});
