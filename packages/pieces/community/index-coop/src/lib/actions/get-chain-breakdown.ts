import { createAction } from '@activepieces/pieces-framework';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Get Index Coop TVL distribution across different blockchain networks',
  props: {},
  async run() {
    const response = await fetch('https://api.llama.fi/protocol/index-coop');
    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status}`);
    }
    const data = await response.json();

    const chains = [];
    let totalTvl = 0;

    if (data.chainTvls) {
      for (const [chain, chainData] of Object.entries(data.chainTvls)) {
        if (chainData.tvl?.length > 0) {
          const chainTvl = chainData.tvl[chainData.tvl.length - 1].totalLiquidityUSD;
          if (chainTvl > 0) {
            chains.push({ chain, tvl: chainTvl, percentage: 0 });
            totalTvl += chainTvl;
          }
        }
      }
    }

    for (const c of chains) {
      c.percentage = totalTvl > 0 ? parseFloat(((c.tvl / totalTvl) * 100).toFixed(2)) : 0;
    }

    chains.sort((a, b) => b.tvl - a.tvl);

    return {
      totalTvl,
      chainCount: chains.length,
      chains,
    };
  },
});
