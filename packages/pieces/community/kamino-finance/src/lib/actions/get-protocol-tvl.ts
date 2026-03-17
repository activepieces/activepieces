import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface DeFiLlamaProtocol {
  name: string;
  tvl: { totalLiquidityUSD: number }[];
  chains: string[];
}

export const getProtocolTvl = createAction({
  name: 'get-protocol-tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch Kamino Finance total value locked (TVL) from DeFiLlama',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<DeFiLlamaProtocol>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/kamino',
    });
    const data = response.body;
    const currentTvl = data.tvl?.[data.tvl.length - 1]?.totalLiquidityUSD ?? 0;
    return {
      name: data.name,
      tvl: currentTvl,
      chains: data.chains,
    };
  },
});
