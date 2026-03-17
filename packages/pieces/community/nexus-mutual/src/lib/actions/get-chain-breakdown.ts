import { createAction } from '@activepieces/pieces-framework';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Get Nexus Mutual TVL distribution across chains from DeFiLlama',
  props: {},
  async run() {
    const response = await fetch('https://api.llama.fi/protocol/nexus-mutual');
    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    const chainTvls: Record<string, number> = data.currentChainTvls ?? {};
    const totalTvl = Object.values(chainTvls).reduce((sum, v) => sum + v, 0);

    const breakdown = Object.entries(chainTvls).map(([chain, tvl]) => ({
      chain,
      tvl_usd: tvl,
      percentage: totalTvl > 0 ? ((tvl / totalTvl) * 100).toFixed(2) + '%' : '0%',
    }));

    breakdown.sort((a, b) => b.tvl_usd - a.tvl_usd);

    return {
      protocol: data.name,
      total_tvl_usd: totalTvl,
      chains: data.chains ?? [],
      chain_breakdown: breakdown,
      fetched_at: new Date().toISOString(),
    };
  },
});
