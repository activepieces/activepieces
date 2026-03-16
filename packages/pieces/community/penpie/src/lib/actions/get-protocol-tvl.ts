import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current total value locked (TVL) in Penpie from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/penpie',
      headers: {
        Accept: 'application/json',
      },
    });

    const data = response.body as Record<string, unknown>;

    return {
      name: data['name'],
      symbol: data['symbol'],
      tvl: data['tvl'],
      currentTvl: Array.isArray(data['tvl'])
        ? (data['tvl'] as Array<{ totalLiquidityUSD: number }>).at(-1)
            ?.totalLiquidityUSD
        : undefined,
      category: data['category'],
      chains: data['chains'],
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
    };
  },
});
