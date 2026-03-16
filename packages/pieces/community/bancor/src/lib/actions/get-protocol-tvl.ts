import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DEFILLAMA_BANCOR_URL } from '../bancor-api';

export const getProtocolTvl = createAction({
  name: 'get-protocol-tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get Bancor total value locked from DeFiLlama',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: DEFILLAMA_BANCOR_URL,
    });
    const data = response.body;
    const latest = data.tvl?.[data.tvl.length - 1];
    return {
      name: data.name,
      tvl: latest?.totalLiquidityUSD ?? 0,
      chain: data.chain,
      description: data.description,
    };
  },
});
