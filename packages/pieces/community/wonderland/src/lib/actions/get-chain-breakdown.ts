import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch the TVL breakdown by blockchain chain for the Wonderland protocol via DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/wonderland',
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;

    const chains = currentChainTvls
      ? Object.entries(currentChainTvls)
          .map(([chain, tvl]) => ({ chain, tvl }))
          .sort((a, b) => b.tvl - a.tvl)
      : [];

    const totalTvl = chains.reduce((sum, c) => sum + c.tvl, 0);

    return {
      total_tvl: totalTvl,
      chain_count: chains.length,
      chains,
    };
  },
});
