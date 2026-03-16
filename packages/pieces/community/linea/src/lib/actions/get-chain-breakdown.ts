import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch the TVL breakdown by individual chains for the Linea protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/linea',
      headers: {
        Accept: 'application/json',
      },
    });

    const data = response.body;
    const chainTvls = data['chainTvls'] as Record<string, unknown> | undefined;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chains = data['chains'] as string[] | undefined;

    const breakdown: Array<{ chain: string; current_tvl: number }> = [];
    if (currentChainTvls) {
      for (const [chain, tvl] of Object.entries(currentChainTvls)) {
        breakdown.push({ chain, current_tvl: tvl });
      }
    }

    breakdown.sort((a, b) => b.current_tvl - a.current_tvl);

    return {
      protocol_name: data['name'],
      chains: chains ?? [],
      chain_breakdown: breakdown,
      total_chains: breakdown.length,
    };
  },
});
