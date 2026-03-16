import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the total value locked (TVL) for the Fraxtal protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/fraxtal',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = response.body as Record<string, unknown>;

    return {
      name: data['name'],
      symbol: data['symbol'],
      tvl: data['tvl'],
      chainTvls: data['chainTvls'],
      category: data['category'],
      chains: data['chains'],
      description: data['description'],
      url: data['url'],
    };
  },
});
