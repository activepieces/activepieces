import { createAction } from '@activepieces/pieces-framework';
import { fetchProtocol, ChainBreakdownItem } from '../bifrost-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch the TVL breakdown by chain for Bifrost Liquid Staking, sorted descending with percentage of total.',
  props: {},
  async run() {
    const protocol = await fetchProtocol();

    const currentChainTvls = protocol.currentChainTvls ?? {};
    const totalTvl = Object.values(currentChainTvls).reduce((sum, v) => sum + v, 0);

    const breakdown: ChainBreakdownItem[] = Object.entries(currentChainTvls)
      .map(([chain, tvlUSD]) => ({
        chain,
        tvlUSD,
        percentage: totalTvl > 0 ? (tvlUSD / totalTvl) * 100 : 0,
      }))
      .sort((a, b) => b.tvlUSD - a.tvlUSD);

    return {
      totalTvlUSD: totalTvl,
      totalTvlFormatted: `$${totalTvl.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
      chainCount: breakdown.length,
      breakdown: breakdown.map((item) => ({
        chain: item.chain,
        tvlUSD: item.tvlUSD,
        tvlFormatted: `$${item.tvlUSD.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
        percentage: parseFloat(item.percentage.toFixed(2)),
        percentageFormatted: `${item.percentage.toFixed(2)}%`,
      })),
      fetchedAt: new Date().toISOString(),
    };
  },
});
