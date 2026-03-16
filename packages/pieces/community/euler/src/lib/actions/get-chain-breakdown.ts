import { createAction } from '@activepieces/pieces-framework';
import { eulerRequest } from '../euler-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Get Euler Finance TVL broken down by chain, sorted by TVL descending',
  auth: undefined,
  props: {},
  async run() {
    const data = await eulerRequest('https://api.llama.fi/protocol/euler');
    const chainTvls = data.currentChainTvls as Record<string, number>;
    const sorted = Object.entries(chainTvls)
      .map(([chain, tvl]) => ({ chain, tvl }))
      .sort((a, b) => b.tvl - a.tvl);
    return {
      chains: sorted,
      totalChains: sorted.length,
      topChain: sorted[0] ?? null,
    };
  },
});
