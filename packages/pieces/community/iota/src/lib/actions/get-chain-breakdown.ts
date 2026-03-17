import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch IOTA TVL broken down by individual chains from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/iota',
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
      total_chains: chains?.length ?? 0,
      chain_breakdown: breakdown,
    };
  },
});
