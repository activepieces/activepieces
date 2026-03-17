import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdownAction = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch Nano TVL broken down by chain from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/nano',
    });
    const data = response.body as Record<string, unknown>;
    return {
      name: data['name'],
      currentChainTvls: data['currentChainTvls'] ?? {},
      chainTvls: data['chainTvls'] ?? {},
    };
  },
});
