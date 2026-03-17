import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the total value locked (TVL) in Marinade Finance from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/marinade',
    });

    const data = response.body;

    return {
      name: data['name'],
      symbol: data['symbol'],
      description: data['description'],
      tvl: data['currentChainTvls'],
      totalTvl: (data['tvl'] as Array<{ totalLiquidityUSD: number }>)?.slice(-1)[0]?.totalLiquidityUSD,
      chains: data['chains'],
      url: data['url'],
      twitter: data['twitter'],
      category: data['category'],
      slug: data['slug'],
    };
  },
});
