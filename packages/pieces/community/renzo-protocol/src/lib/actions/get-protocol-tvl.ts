import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

type DefiLlamaProtocol = {
  name: string;
  tvl: { totalLiquidityUSD: number }[];
  chains: string[];
};

export const getProtocolTvl = createAction({
  name: 'get-protocol-tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch Renzo Protocol total value locked from DeFiLlama',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<DefiLlamaProtocol>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/renzo',
    });
    const data = response.body;
    const currentTvl = data.tvl?.[data.tvl.length - 1]?.totalLiquidityUSD ?? 0;
    return {
      name: data.name,
      tvl: currentTvl,
      tvlFormatted: `$${(currentTvl / 1e9).toFixed(2)}B`,
      chains: data.chains,
      chainCount: data.chains?.length ?? 0,
    };
  },
});
