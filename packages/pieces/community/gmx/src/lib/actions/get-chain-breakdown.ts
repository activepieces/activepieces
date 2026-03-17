import { createAction } from '@activepieces/pieces-framework';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Get GMX TVL distribution across different chains',
  props: {},
  async run() {
    const response = await fetch('https://api.llama.fi/protocol/gmx');
    if (!response.ok) throw new Error(`DeFiLlama API error: ${response.status}`);
    const data = await response.json();
    const chains = data.currentChainTvls ?? {};
    const sorted = Object.entries(chains)
      .map(([chain, tvl]) => ({ chain, tvl: tvl as number }))
      .sort((a, b) => b.tvl - a.tvl);
    return { chains: sorted, total: sorted.reduce((sum, c) => sum + c.tvl, 0) };
  },
});