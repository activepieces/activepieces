import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the total value locked (TVL) for the Wonderland protocol across all chains via DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/wonderland',
    });

    const data = response.body as Record<string, unknown>;

    return {
      name: data['name'],
      symbol: data['symbol'],
      chain: data['chain'],
      tvl: data['tvl'],
      currentChainTvls: data['currentChainTvls'],
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
    };
  },
});
