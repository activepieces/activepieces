import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get TVL Chain Breakdown',
  description: 'Fetch the TVL breakdown by blockchain chain for LooksRare from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/looksrare',
    });

    const data = response.body;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number>;
    const chains = data['chains'] as string[];

    const breakdown = chains.map((chain: string) => ({
      chain,
      tvl: currentChainTvls[chain] ?? 0,
    }));

    breakdown.sort((a, b) => b.tvl - a.tvl);

    return {
      chains: breakdown,
      total_chains: chains.length,
      dominant_chain: breakdown.length > 0 ? breakdown[0].chain : null,
      dominant_chain_tvl: breakdown.length > 0 ? breakdown[0].tvl : 0,
    };
  },
});
