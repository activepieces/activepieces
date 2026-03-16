import { createAction } from '@activepieces/pieces-framework';
import { lyraRequest } from '../lyra-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Fetch Lyra Finance TVL broken down by chain, sorted by TVL descending.',
  auth: undefined,
  props: {},
  async run() {
    const data = await lyraRequest('https://api.llama.fi/protocol/lyra');
    const chainTvls: Record<string, number> = data.currentChainTvls ?? {};
    const sorted = Object.entries(chainTvls)
      .map(([chain, tvl]) => ({ chain, tvl: tvl as number }))
      .sort((a, b) => b.tvl - a.tvl);
    return {
      chains: sorted,
      total_tvl: sorted.reduce((sum, c) => sum + c.tvl, 0),
    };
  },
});
