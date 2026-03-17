import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current Total Value Locked (TVL) for the Rootstock (RSK) protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      tvl: number;
      name: string;
      symbol: string;
      description: string;
      chains: string[];
      category: string;
      currentChainTvls: Record<string, number>;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/rsk',
    });

    const data = response.body;

    return {
      name: data.name,
      symbol: data.symbol,
      description: data.description,
      tvl: data.tvl,
      chains: data.chains,
      category: data.category,
      currentChainTvls: data.currentChainTvls,
    };
  },
});
