import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current Total Value Locked (TVL) for Invariant from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      tvl: number;
      name: string;
      symbol: string;
      chain: string;
      category: string;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/tvl/invariant',
    });

    return {
      protocol: 'Invariant',
      tvl_usd: response.body,
    };
  },
});
