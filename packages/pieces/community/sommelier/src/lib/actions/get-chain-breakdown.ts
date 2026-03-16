import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description:
    "Get Sommelier Finance's TVL broken down by blockchain from DeFiLlama.",
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      name: string;
      chains: string[];
      currentChainTvls: Record<string, number>;
      tvl: number;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/sommelier',
    });

    const data = response.body;
    const chainTvls = data.currentChainTvls ?? {};

    const breakdown = Object.entries(chainTvls).map(([chain, tvl]) => ({
      chain,
      tvl,
      percentage:
        data.tvl > 0 ? ((tvl / data.tvl) * 100).toFixed(2) + '%' : '0%',
    }));

    breakdown.sort((a, b) => b.tvl - a.tvl);

    return {
      totalTvl: data.tvl,
      chains: data.chains,
      breakdown,
    };
  },
});
