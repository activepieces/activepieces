import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch the TVL breakdown by chain for NEAR Protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      name: string;
      chains: string[];
      currentChainTvls: Record<string, number>;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/near',
    });
    const data = response.body;
    const chainBreakdown = Object.entries(data.currentChainTvls)
      .map(([chain, tvl]) => ({ chain, tvlUsd: tvl }))
      .sort((a, b) => b.tvlUsd - a.tvlUsd);
    return {
      name: data.name,
      chains: data.chains,
      chainBreakdown,
      totalChains: data.chains.length,
    };
  },
});
