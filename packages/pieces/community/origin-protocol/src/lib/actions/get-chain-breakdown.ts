import { createAction } from '@activepieces/pieces-framework';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Get TVL distribution across chains for Origin Protocol from DeFiLlama',
  auth: undefined,
  props: {},
  async run() {
    const response = await fetch('https://api.llama.fi/protocol/origin-protocol');
    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    const chainTvls = data.chainTvls ?? {};
    const breakdown: Record<string, number | null> = {};

    for (const [chain, chainData] of Object.entries(chainTvls)) {
      const tvlArray = (chainData as any).tvl ?? [];
      if (tvlArray.length > 0) {
        breakdown[chain] = tvlArray[tvlArray.length - 1].totalLiquidityUSD ?? null;
      } else {
        breakdown[chain] = null;
      }
    }

    const totalTvl = Object.values(breakdown).reduce(
      (sum, val) => (sum ?? 0) + (val ?? 0),
      0
    );

    return {
      name: data.name,
      chains: data.chains,
      chainBreakdown: breakdown,
      totalTvlUsd: totalTvl,
    };
  },
});
