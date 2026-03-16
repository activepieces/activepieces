import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get-protocol-tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current total value locked (TVL) in the Connext protocol from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/connext',
    });
    const data = response.body as Record<string, unknown>;
    return {
      name: data['name'],
      tvl: data['currentChainTvls'],
      totalTvl: data['tvl'],
      slug: data['slug'],
      symbol: data['symbol'],
      chain: data['chain'],
      chains: data['chains'],
    };
  },
});
