import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Fetch the TVL breakdown for Benqi by blockchain chain via DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      currentChainTvls: Record<string, number>;
      chainTvls: Record<string, {
        tvl: Array<{ date: number; totalLiquidityUSD: number }>;
        tokens?: Array<{ date: number; tokens: Record<string, number> }>;
        tokensInUsd?: Array<{ date: number; tokens: Record<string, number> }>;
      }>;
      name: string;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/benqi',
      headers: { 'Accept': 'application/json' },
    });

    const data = response.body;
    const chains: Array<{ chain: string; currentTvlUSD: number; latestTvlUSD: number | null }> = [];

    for (const [chain, value] of Object.entries(data.currentChainTvls)) {
      const chainHistory = data.chainTvls ? data.chainTvls[chain] : null;
      const latestTvl =
        chainHistory && chainHistory.tvl && chainHistory.tvl.length > 0
          ? chainHistory.tvl[chainHistory.tvl.length - 1].totalLiquidityUSD
          : null;
      chains.push({
        chain,
        currentTvlUSD: value,
        latestTvlUSD: latestTvl,
      });
    }

    chains.sort((a, b) => b.currentTvlUSD - a.currentTvlUSD);

    const totalTvl = chains.reduce((sum, c) => sum + c.currentTvlUSD, 0);

    return {
      protocol: data.name,
      totalTvlUSD: totalTvl,
      chainCount: chains.length,
      chains,
    };
  },
});
