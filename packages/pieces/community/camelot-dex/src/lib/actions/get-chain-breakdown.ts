import { createAction } from '@activepieces/pieces-framework';
import { getProtocolData } from '../../camelot-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Get Camelot DEX TVL broken down by chain, sorted descending by TVL.',
  props: {},
  async run() {
    const data = await getProtocolData();
    const chainTvls = data.chainTvls as Record<string, { tvl: Array<{ date: number; totalLiquidityUSD: number }> }>;

    const breakdown = Object.entries(chainTvls)
      .map(([chain, chainData]) => {
        const tvlArr = chainData.tvl ?? [];
        const sorted = [...tvlArr].sort((a, b) => b.date - a.date);
        const latestTvl = sorted[0]?.totalLiquidityUSD ?? 0;
        return { chain, tvl: latestTvl };
      })
      .filter((entry) => entry.tvl > 0)
      .sort((a, b) => b.tvl - a.tvl);

    return { chains: breakdown };
  },
});
