import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvlAction = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current Total Value Locked (TVL) for Li.Fi from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      name: string;
      symbol: string;
      tvl: number;
      currentChainTvls: Record<string, number>;
      category: string;
      chains: string[];
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/li.fi',
    });

    const data = response.body;

    return {
      name: data.name,
      symbol: data.symbol,
      tvl: data.tvl,
      category: data.category,
      chains: data.chains,
      currentChainTvls: data.currentChainTvls,
    };
  },
});
