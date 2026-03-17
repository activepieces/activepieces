import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Retrieve the TVL breakdown by chain for Kusama from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/kusama',
    });

    const data = response.body as Record<string, unknown>;

    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chains = data['chains'] as string[] | undefined;

    const breakdown = currentChainTvls
      ? Object.entries(currentChainTvls).map(([chain, tvl]) => ({ chain, tvl }))
      : [];

    breakdown.sort((a, b) => b.tvl - a.tvl);

    return {
      protocol: data['name'],
      total_chains: chains ? chains.length : 0,
      chains: chains || [],
      tvl_by_chain: breakdown,
    };
  },
});
