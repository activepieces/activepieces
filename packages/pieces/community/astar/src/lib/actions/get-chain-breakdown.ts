import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch the TVL breakdown by chain for Astar Network from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/astar',
    });
    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chains = data['chains'] as string[] | undefined;
    const chainTvlBreakdown = currentChainTvls
      ? Object.entries(currentChainTvls).map(([chain, tvl]) => ({ chain, tvl }))
      : [];
    return {
      chains: chains ?? [],
      chain_tvl_breakdown: chainTvlBreakdown,
      total_chains: chains ? chains.length : 0,
    };
  },
});
