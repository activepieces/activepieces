import { createAction } from '@activepieces/pieces-framework';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Get Ribbon Finance TVL distribution across chains from DeFiLlama',
  props: {},
  async run() {
    const response = await fetch('https://api.llama.fi/protocol/ribbon-finance');
    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    const currentChainTvls = data.currentChainTvls || {};
    const totalTvl = data.tvl || 0;

    const chains = Object.entries(currentChainTvls).map(([chain, tvl]) => ({
      chain,
      tvl: tvl as number,
      percentage: totalTvl > 0 ? (((tvl as number) / totalTvl) * 100).toFixed(2) + '%' : '0%',
    }));

    chains.sort((a, b) => b.tvl - a.tvl);

    return {
      total_tvl: totalTvl,
      chains,
    };
  },
});
