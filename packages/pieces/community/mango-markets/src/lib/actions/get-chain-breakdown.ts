import { createAction } from '@activepieces/pieces-framework';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Get TVL distribution across chains for Mango Markets (primarily Solana) from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await fetch('https://api.llama.fi/protocol/mango-markets');
    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status}`);
    }
    const data = await response.json();

    const chainTvls: Record<string, number> = data.currentChainTvls ?? {};
    const totalTvl = Object.values(chainTvls).reduce((sum, v) => sum + v, 0);

    const breakdown = Object.entries(chainTvls).map(([chain, tvl]) => ({
      chain,
      tvlUsd: tvl,
      percentage: totalTvl > 0 ? ((tvl / totalTvl) * 100).toFixed(2) + '%' : '0%',
    }));

    return {
      totalTvlUsd: totalTvl,
      chains: breakdown,
      primaryChain: breakdown.sort((a, b) => b.tvlUsd - a.tvlUsd)[0]?.chain ?? 'Solana',
    };
  },
});
