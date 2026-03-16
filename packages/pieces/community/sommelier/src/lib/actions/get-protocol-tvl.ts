import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description:
    'Fetch the current Total Value Locked (TVL) for Sommelier Finance from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      tvl: number;
      name: string;
      symbol: string;
      chain: string;
      chains: string[];
      currentChainTvls: Record<string, number>;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/sommelier',
    });

    const data = response.body;

    return {
      name: data.name,
      symbol: data.symbol,
      tvl: data.tvl,
      chains: data.chains,
      currentChainTvls: data.currentChainTvls,
    };
  },
});
