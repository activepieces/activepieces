import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetches the TVL breakdown by blockchain chain for the Stride protocol from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/stride',
    });
    const data = response.body as Record<string, unknown>;
    const chainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chains = chainTvls
      ? Object.entries(chainTvls)
          .map(([chain, tvl]) => ({ chain, tvl }))
          .sort((a, b) => b.tvl - a.tvl)
      : [];
    return {
      protocol: data['name'],
      chains,
      total_chains: chains.length,
    };
  },
});
