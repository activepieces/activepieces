import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current Total Value Locked (TVL) for Bifrost Finance from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/bifrost-finance',
    });

    const data = response.body as Record<string, unknown>;

    return {
      name: data['name'],
      symbol: data['symbol'],
      tvl: data['tvl'],
      chainTvls: data['chainTvls'],
      category: data['category'],
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
      governanceID: data['governanceID'],
    };
  },
});
