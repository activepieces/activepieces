import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Get the TVL breakdown by blockchain chain for Ankr Network from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/ankr',
    });

    const data = response.body as Record<string, unknown>;
    const chainTvls = data['chainTvls'] as Record<string, { tvl: Array<{ date: number; totalLiquidityUSD: number }> }>;

    if (!chainTvls) {
      return { chains: [] };
    }

    const breakdown: Array<{ chain: string; tvl: number }> = [];

    for (const [chain, chainData] of Object.entries(chainTvls)) {
      if (chain.includes('-')) continue; // skip sub-categories like "BSC-staking"
      const tvlHistory = chainData.tvl;
      if (tvlHistory && tvlHistory.length > 0) {
        const latestTvl = tvlHistory[tvlHistory.length - 1].totalLiquidityUSD;
        breakdown.push({ chain, tvl: latestTvl });
      }
    }

    breakdown.sort((a, b) => b.tvl - a.tvl);

    return {
      protocol: 'Ankr',
      chain_count: breakdown.length,
      chains: breakdown,
    };
  },
});
