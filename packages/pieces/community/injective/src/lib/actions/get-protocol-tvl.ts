import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch current Total Value Locked (TVL) for Injective protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/injective',
    });

    const data = response.body as Record<string, unknown>;

    return {
      name: data['name'],
      symbol: data['symbol'],
      currentTvl: (data as Record<string, unknown> & { tvl?: number })['tvl'] ?? null,
      chain: data['chain'],
      category: data['category'],
      slug: data['slug'],
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
      geckoId: data['gecko_id'],
    };
  },
});
