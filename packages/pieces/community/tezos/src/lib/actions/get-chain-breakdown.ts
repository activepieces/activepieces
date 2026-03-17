import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch the TVL breakdown by chain for the Tezos protocol via DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/tezos',
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chainTvls = data['chainTvls'] as Record<string, unknown> | undefined;

    const breakdown = currentChainTvls
      ? Object.entries(currentChainTvls).map(([chain, tvl]) => ({ chain, tvl }))
      : [];

    breakdown.sort((a, b) => (b.tvl as number) - (a.tvl as number));

    return {
      protocol: data['name'],
      total_tvl: data['tvl'],
      chain_breakdown: breakdown,
      chain_details: chainTvls,
    };
  },
});
