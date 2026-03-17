import { createAction } from '@activepieces/pieces-framework';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Get StakeDAO TVL distribution across chains from DeFiLlama',
  auth: undefined,
  props: {},
  async run() {
    const response = await fetch('https://api.llama.fi/protocol/stakedao');
    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json() as Record<string, unknown>;
    const chainTvls = data['chainTvls'] as Record<string, unknown> | undefined;

    if (!chainTvls) {
      return { chains: [], totalChains: 0 };
    }

    const chains = Object.entries(chainTvls).map(([chain, tvlData]) => {
      const tvlArray = (tvlData as { tvl?: {totalLiquidityUSD: number}[] })?.tvl;
      const latestTvl = Array.isArray(tvlArray) ? tvlArray.at(-1)?.totalLiquidityUSD : null;
      return {
        chain,
        tvlUsd: latestTvl ?? null,
      };
    });

    chains.sort((a, b) => (b.tvlUsd ?? 0) - (a.tvlUsd ?? 0));

    return {
      chains,
      totalChains: chains.length,
    };
  },
});
