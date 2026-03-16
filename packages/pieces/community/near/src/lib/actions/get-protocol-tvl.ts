import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current Total Value Locked (TVL) for NEAR Protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      tvl: number;
      name: string;
      symbol: string;
      category: string;
      chains: string[];
      currentChainTvls: Record<string, number>;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/near',
    });
    const data = response.body;
    return {
      name: data.name,
      symbol: data.symbol,
      category: data.category,
      tvl: data.tvl,
      chains: data.chains,
      currentChainTvls: data.currentChainTvls,
    };
  },
});
