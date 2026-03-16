import { createAction } from '@activepieces/pieces-framework';
import { ribbonRequest } from '../ribbon-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Retrieve TVL breakdown by chain for Ribbon Finance, sorted by TVL descending.',
  props: {},
  async run() {
    const data = await ribbonRequest('https://api.llama.fi/protocol/ribbon');
    const currentChainTvls: Record<string, number> = data.currentChainTvls ?? {};

    const sorted = Object.entries(currentChainTvls)
      .map(([chain, tvl]) => ({ chain, tvl: tvl as number }))
      .sort((a, b) => b.tvl - a.tvl);

    return {
      total_tvl: data.tvl,
      chains: sorted,
      chain_count: sorted.length,
    };
  },
});
