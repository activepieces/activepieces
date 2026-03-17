import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description:
    'Fetch the current total value locked (TVL) for Moonriver via DeFiLlama. No API key required.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/moonriver',
    });
    const data = response.body as Record<string, unknown>;
    return {
      name: data['name'],
      symbol: data['symbol'],
      tvl: data['tvl'],
      chain: data['chain'],
      category: data['category'],
      description: data['description'],
      url: data['url'],
    };
  },
});
