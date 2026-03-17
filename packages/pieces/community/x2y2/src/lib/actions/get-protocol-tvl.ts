import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvlAction = createAction({
  name: 'get-protocol-tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current total value locked (TVL) for X2Y2 from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/x2y2',
    });

    const data = response.body as Record<string, unknown>;
    return {
      name: data['name'],
      tvl: data['currentChainTvls'],
      totalTvl: data['tvl'],
      category: data['category'],
      chains: data['chains'],
    };
  },
});
