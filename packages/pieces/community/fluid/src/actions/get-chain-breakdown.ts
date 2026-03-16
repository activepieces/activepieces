import { createAction } from '@activepieces/pieces-framework';
import { makeRequest } from '../lib/fluid-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get TVL by Chain',
  description: 'Get Fluid protocol TVL broken down by blockchain from DeFiLlama.',
  props: {},
  async run() {
    const data = await makeRequest('/protocol/fluid');
    const chainTvls: Record<string, number> = data.currentChainTvls || {};
    const chains = Object.entries(chainTvls)
      .map(([chain, tvl]) => ({ chain, tvl: tvl as number }))
      .sort((a, b) => b.tvl - a.tvl);
    return {
      total_tvl: data.tvl,
      chains,
      chain_count: chains.length,
    };
  },
});
