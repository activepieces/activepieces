import { createAction } from '@activepieces/pieces-framework';
import { lyraRequest } from '../lyra-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch Lyra Finance Total Value Locked (TVL) and protocol info from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const data = await lyraRequest('https://api.llama.fi/protocol/lyra');
    return {
      name: data.name,
      description: data.description,
      tvl: data.tvl,
      chains: data.chains,
      currentChainTvls: data.currentChainTvls,
      category: data.category,
      url: data.url,
    };
  },
});
