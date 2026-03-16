import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Fetch the TVL breakdown by blockchain for the Wormhole protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/wormhole',
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chainTvls = data['chainTvls'] as Record<string, { tvl: number }> | undefined;

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
      raw_chain_tvls: chainTvls,
    };
  },
});
