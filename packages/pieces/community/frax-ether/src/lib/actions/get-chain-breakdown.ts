import { createAction } from '@activepieces/pieces-framework';
import { getProtocolData, formatUSD } from '../frax-ether-api';

export const getChainBreakdown = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Get Frax Ether TVL broken down by chain, sorted descending with % of total.',
  props: {},
  async run() {
    const data = await getProtocolData();

    const chainTvls = data.chainTvls as Record<string, { tvl: Array<{ date: number; totalLiquidityUSD: number }> }>;
    const chainCurrentTvls: Record<string, number> = {};

    for (const [chain, chainData] of Object.entries(chainTvls)) {
      if (chain.includes('-') || !chainData.tvl || chainData.tvl.length === 0) continue;
      const latest = chainData.tvl[chainData.tvl.length - 1];
      chainCurrentTvls[chain] = latest.totalLiquidityUSD;
    }

    const totalTvl = Object.values(chainCurrentTvls).reduce((sum, v) => sum + v, 0);

    const breakdown = Object.entries(chainCurrentTvls)
      .map(([chain, tvl]) => ({
        chain,
        tvl,
        tvl_formatted: formatUSD(tvl),
        percentage: totalTvl > 0 ? parseFloat(((tvl / totalTvl) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.tvl - a.tvl);

    return {
      total_tvl: totalTvl,
      total_tvl_formatted: formatUSD(totalTvl),
      chains: breakdown,
      chain_count: breakdown.length,
    };
  },
});
