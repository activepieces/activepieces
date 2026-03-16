import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getChainBreakdownAction = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get TVL by Chain',
  description:
    'Fetch a breakdown of the Pangolin protocol TVL by blockchain chain from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/pangolin',
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chains = data['chains'] as string[] | undefined;

    const breakdown = Object.entries(currentChainTvls ?? {}).map(([chain, tvl]) => ({
      chain,
      tvl,
    }));

    // Sort by TVL descending
    breakdown.sort((a, b) => b.tvl - a.tvl);

    return {
      total_tvl: data['tvl'],
      chains_count: (chains ?? []).length,
      chains: chains ?? [],
      chain_breakdown: breakdown,
    };
  },
});
