import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: "Fetch Solend's TVL breakdown by blockchain from DeFiLlama.",
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/solend',
    });

    const data = response.body as any;
    const currentChainTvls: Record<string, number> = data.currentChainTvls ?? {};

    const chains = Object.entries(currentChainTvls).map(([chain, tvl]) => ({
      chain,
      tvlUSD: tvl,
    }));

    chains.sort((a, b) => b.tvlUSD - a.tvlUSD);

    return {
      protocol: data.name,
      totalTvlUSD: chains.reduce((sum, c) => sum + c.tvlUSD, 0),
      chainCount: chains.length,
      chains,
    };
  },
});
