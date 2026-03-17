import { createAction } from '@activepieces/pieces-framework';
import { ChainBreakdownEntry, fetchProtocolData } from '../origin-ether-api';

export const getChainBreakdownAction = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch TVL breakdown by blockchain network for Origin Ether, sorted by TVL descending with percentage of total.',
  props: {},
  async run() {
    const data = await fetchProtocolData();

    const chainTvls = data.currentChainTvls ?? {};

    const total = Object.values(chainTvls).reduce((sum, val) => sum + val, 0);

    const breakdown: ChainBreakdownEntry[] = Object.entries(chainTvls)
      .map(([chain, tvl]) => ({
        chain,
        tvl,
        percentage: total > 0 ? parseFloat(((tvl / total) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.tvl - a.tvl);

    return {
      totalTvlUsd: total,
      chains: breakdown,
      fetchedAt: new Date().toISOString(),
    };
  },
});
