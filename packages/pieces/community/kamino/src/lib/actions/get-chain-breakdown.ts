import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch the TVL breakdown by blockchain chain for Kamino Finance from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      currentChainTvls: Record<string, number>;
      chainTvls: Record<string, { tvl: Array<{ date: number; totalLiquidityUSD: number }> }>;
      name: string;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/kamino',
    });

    const data = response.body;
    const currentChainTvls = data.currentChainTvls || {};

    const chains = Object.entries(currentChainTvls)
      .map(([chain, tvl]) => ({ chain, tvlUSD: tvl }))
      .sort((a, b) => b.tvlUSD - a.tvlUSD);

    const totalTvl = chains.reduce((sum, c) => sum + c.tvlUSD, 0);

    return {
      protocol: data.name,
      totalTvlUSD: totalTvl,
      chains,
      chainCount: chains.length,
    };
  },
});
