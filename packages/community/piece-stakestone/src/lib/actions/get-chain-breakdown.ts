import { createAction } from '@activepieces/pieces-framework';
import { fetchProtocolDetail, formatUsd } from '../stakestone-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch TVL breakdown by chain for StakeStone, sorted descending with percentage of total.',
  props: {},
  async run() {
    const protocol = await fetchProtocolDetail();

    const chainTvls = protocol.currentChainTvls ?? {};
    const totalTvl = Object.values(chainTvls).reduce((sum, v) => sum + v, 0);

    const chains = Object.entries(chainTvls)
      .map(([chain, tvl]) => ({
        chain,
        tvl,
        tvlFormatted: formatUsd(tvl),
        percentage: totalTvl > 0 ? Number(((tvl / totalTvl) * 100).toFixed(2)) : 0,
        percentageFormatted: totalTvl > 0 ? `${((tvl / totalTvl) * 100).toFixed(2)}%` : '0.00%',
      }))
      .sort((a, b) => b.tvl - a.tvl);

    return {
      totalTvl,
      totalTvlFormatted: formatUsd(totalTvl),
      chainCount: chains.length,
      chains,
      source: 'DeFiLlama',
      timestamp: new Date().toISOString(),
    };
  },
});
