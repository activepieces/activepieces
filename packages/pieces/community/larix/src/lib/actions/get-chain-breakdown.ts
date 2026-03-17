import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch the TVL breakdown by blockchain for the Larix protocol from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/larix',
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number>;
    const chains = data['chains'] as string[];

    const breakdown = chains?.map((chain: string) => ({
      chain,
      tvl: currentChainTvls?.[chain] ?? 0,
    })) ?? [];

    return {
      protocol: data['name'],
      chains: breakdown,
      total_chains: chains?.length ?? 0,
    };
  },
});
