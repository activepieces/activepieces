import { createAction } from '@activepieces/pieces-framework';
import { notionalRequest } from '../notional-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Get TVL breakdown by chain for Notional Finance, sorted by TVL',
  auth: undefined,
  props: {},
  async run() {
    const data = await notionalRequest('https://api.llama.fi/protocol/notional');
    const chainTvls = data.currentChainTvls as Record<string, number>;
    const sorted = Object.entries(chainTvls)
      .map(([chain, tvl]) => ({ chain, tvl }))
      .sort((a, b) => b.tvl - a.tvl);
    return {
      chains: sorted,
      totalChains: sorted.length,
    };
  },
});
