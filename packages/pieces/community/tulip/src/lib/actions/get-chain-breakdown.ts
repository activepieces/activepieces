import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get TVL Chain Breakdown',
  description: 'Fetch the TVL breakdown by blockchain for Tulip Protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/tulip',
    });
    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chains = data['chains'] as string[] | undefined;

    const breakdown = Object.entries(currentChainTvls ?? {})
      .map(([chain, tvl]) => ({ chain, tvl }))
      .sort((a, b) => b.tvl - a.tvl);

    return {
      chains,
      tvl_by_chain: breakdown,
      total_chains: breakdown.length,
    };
  },
});
