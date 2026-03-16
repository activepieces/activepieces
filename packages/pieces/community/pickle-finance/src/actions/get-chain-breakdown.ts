import { createAction } from '@activepieces/pieces-framework';
import { getChainBreakdown as fetchChainBreakdown } from '../pickle-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Returns Pickle Finance TVL broken down by blockchain, sorted by TVL descending. Useful for understanding which chains have the most liquidity deployed in Pickle Jars.',
  props: {},
  async run() {
    const chainTvls = await fetchChainBreakdown();

    const chains = Object.entries(chainTvls)
      .map(([chain, tvl]) => ({ chain, tvl_usd: tvl }))
      .sort((a, b) => b.tvl_usd - a.tvl_usd);

    const totalTvl = chains.reduce((sum, c) => sum + c.tvl_usd, 0);

    return {
      chains,
      total_tvl_usd: totalTvl,
      chain_count: chains.length,
    };
  },
});
