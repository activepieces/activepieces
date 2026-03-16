import { createAction } from '@activepieces/pieces-framework';
import { getChainBreakdown as fetchChainBreakdown } from '../badger-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Returns Badger DAO TVL broken down by blockchain, sorted by TVL descending, from DeFiLlama.',
  props: {},
  async run() {
    const chains = await fetchChainBreakdown();
    const totalTvl = chains.reduce((sum: number, c: any) => sum + c.tvl, 0);
    return {
      chains,
      totalTvl,
      chainCount: chains.length,
      source: 'DeFiLlama',
    };
  },
});
