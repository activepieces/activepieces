import { createAction } from '@activepieces/pieces-framework';
import { fetchProtocol } from '../rocket-pool-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description:
    'Fetch Rocket Pool TVL broken down by blockchain, sorted descending with percentage of total.',
  props: {},
  async run() {
    const data = await fetchProtocol();
    const currentChainTvls = data.currentChainTvls ?? {};

    const sorted = (Object.entries(currentChainTvls) as [string, number][])
      .map(([chain, tvlUSD]) => ({ chain, tvlUSD }))
      .sort((a, b) => b.tvlUSD - a.tvlUSD);

    const totalTvlUSD = sorted.reduce((sum, c) => sum + c.tvlUSD, 0);

    const chains = sorted.map((c) => ({
      chain: c.chain,
      tvlUSD: c.tvlUSD,
      pctOfTotal:
        totalTvlUSD > 0
          ? parseFloat(((c.tvlUSD / totalTvlUSD) * 100).toFixed(2))
          : 0,
    }));

    return {
      protocol: data.name,
      totalTvlUSD,
      chainCount: chains.length,
      chains,
    };
  },
});
