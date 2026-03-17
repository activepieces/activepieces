import { createAction } from '@activepieces/pieces-framework';
import { fetchEigenLayerProtocol, parseChainBreakdown } from '../eigenlayer-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description:
    'Fetches the TVL breakdown by chain for EigenLayer, sorted by TVL descending with percentage of total.',
  props: {},
  async run() {
    const protocol = await fetchEigenLayerProtocol();
    const breakdown = parseChainBreakdown(protocol.chainTvls);

    const totalTvl = breakdown.reduce((sum, item) => sum + item.tvl, 0);

    return {
      total_tvl: totalTvl,
      total_tvl_formatted: `$${(totalTvl / 1e9).toFixed(2)}B`,
      chain_count: breakdown.length,
      chains: breakdown.map((item) => ({
        chain: item.chain,
        tvl: item.tvl,
        tvl_formatted: `$${(item.tvl / 1e9).toFixed(2)}B`,
        percentage: item.percentage,
        percentage_formatted: `${item.percentage}%`,
      })),
    };
  },
});
