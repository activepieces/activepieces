import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { TRUEFI_LLAMA_URL } from '../truefi-api';

export const getProtocolTvl = createAction({
  name: 'get-protocol-tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get TrueFi total value locked from DeFiLlama',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: TRUEFI_LLAMA_URL,
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
