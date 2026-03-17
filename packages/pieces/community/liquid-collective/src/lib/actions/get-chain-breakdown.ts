import { createAction } from '@activepieces/pieces-framework';
import { fetchProtocolData, buildChainBreakdown } from '../liquid-collective-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description:
    'Fetch Liquid Collective TVL broken down by chain, sorted by TVL descending with percentage of total.',
  auth: undefined,
  props: {},
  async run() {
    const protocol = await fetchProtocolData();
    const breakdown = buildChainBreakdown(protocol);

    const totalTvl = breakdown.reduce((sum, item) => sum + item.tvl, 0);

    return {
      totalTvl,
      totalTvlFormatted: `$${totalTvl.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
      chains: breakdown.map((item) => ({
        chain: item.chain,
        tvl: item.tvl,
        tvlFormatted: `$${item.tvl.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
        percentage: item.percentage,
        percentageFormatted: `${item.percentage}%`,
      })),
      chainCount: breakdown.length,
    };
  },
});
