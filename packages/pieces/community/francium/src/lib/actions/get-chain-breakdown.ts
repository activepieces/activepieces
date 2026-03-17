import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Fetches the TVL breakdown by blockchain for the Francium protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/francium',
    });

    const data = response.body;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chains = data['chains'] as string[] | undefined;

    const breakdown = currentChainTvls
      ? Object.entries(currentChainTvls).map(([chain, tvl]) => ({
          chain,
          tvl_usd: tvl,
        }))
      : [];

    breakdown.sort((a, b) => b.tvl_usd - a.tvl_usd);

    return {
      chains: chains ?? [],
      chain_tvl_breakdown: breakdown,
      total_chains: breakdown.length,
    };
  },
});
