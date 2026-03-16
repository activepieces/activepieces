import { createAction } from '@activepieces/pieces-framework';
import { defiLlamaRequest } from '../rocket-pool-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Get Rocket Pool TVL broken down by chain, sorted by TVL descending',
  props: {},
  async run() {
    const data = await defiLlamaRequest<any>('/protocol/rocket-pool');
    const currentChainTvls = data.currentChainTvls ?? {};
    const sorted = Object.entries(currentChainTvls)
      .map(([chain, tvl]) => ({ chain, tvlUSD: tvl }))
      .sort((a, b) => b.tvlUSD - a.tvlUSD);
    return {
      protocol: data.name,
      totalTvlUSD: sorted.reduce((sum, c) => sum + c.tvlUSD, 0),
      chainCount: sorted.length,
      chains: sorted,
    };
  },
});
