import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DEFILLAMA_ANGLE_URL } from '../angle-api';

export const getProtocolTvl = createAction({
  name: 'get-protocol-tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get Angle Protocol total value locked from DeFiLlama',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: DEFILLAMA_ANGLE_URL,
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
