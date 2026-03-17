import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch the TVL breakdown by blockchain for the Blur NFT marketplace protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/blur',
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chainTvls = data['chainTvls'] as Record<string, unknown> | undefined;

    const chains = currentChainTvls
      ? Object.entries(currentChainTvls).map(([chain, tvl]) => ({ chain, tvl }))
      : [];

    return {
      protocol: data['name'],
      totalTvl: data['tvl'],
      chains,
      chainTvlDetails: chainTvls,
    };
  },
});
