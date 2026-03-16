import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get-protocol-tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current Total Value Locked (TVL) for the Sei Network protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/sei',
    });
    const data = response.body as Record<string, unknown>;
    return {
      name: data['name'],
      symbol: data['symbol'],
      tvl: data['tvl'],
      currentChainTvls: data['currentChainTvls'],
      category: data['category'],
      chains: data['chains'],
      description: data['description'],
      url: data['url'],
    };
  },
});
