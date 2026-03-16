import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current total value locked (TVL) for the Celo protocol from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/celo',
    });

    const data = response.body as Record<string, unknown>;

    return {
      name: data['name'],
      slug: data['slug'],
      tvl: data['tvl'],
      chainTvls: data['chainTvls'],
      description: data['description'],
      url: data['url'],
      category: data['category'],
    };
  },
});
