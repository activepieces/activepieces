import { createAction } from '@activepieces/pieces-framework';
import { getDefiLlamaProtocol } from '../port-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current Total Value Locked (TVL) for Port Finance from DeFiLlama.',
  props: {},
  async run() {
    const data = await getDefiLlamaProtocol();
    return {
      name: data.name,
      symbol: data.symbol,
      tvl: data.tvl,
      currentChainTvls: data.currentChainTvls,
      category: data.category,
      chains: data.chains,
      url: data.url,
      description: data.description,
    };
  },
});
