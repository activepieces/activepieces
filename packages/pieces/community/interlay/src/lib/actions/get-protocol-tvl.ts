import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get-protocol-tvl',
  displayName: 'Get Protocol TVL',
  description:
    'Fetch the current Total Value Locked (TVL) for Interlay from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/interlay',
    });
    const data = response.body as Record<string, unknown>;
    return {
      name: data['name'],
      current_chain_tvls: data['currentChainTvls'],
      chains: data['chains'],
      category: data['category'],
      description: data['description'],
      symbol: data['symbol'],
      gecko_id: data['gecko_id'],
    };
  },
});
