import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch the TVL breakdown by individual blockchain for LayerZero from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/layerzero',
    });
    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;

    if (!currentChainTvls) {
      return { chains: [] };
    }

    const chains = Object.entries(currentChainTvls)
      .map(([chain, tvl]) => ({ chain, tvl }))
      .sort((a, b) => b.tvl - a.tvl);

    return {
      protocolName: data['name'],
      totalChains: chains.length,
      chains,
    };
  },
});
