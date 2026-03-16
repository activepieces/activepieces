import { createAction, Property } from '@activepieces/pieces-framework';
import { ribbonRequest } from '../ribbon-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Retrieve Ribbon Finance total value locked (TVL), chains, and protocol description from DeFiLlama.',
  props: {},
  async run() {
    const data = await ribbonRequest('https://api.llama.fi/protocol/ribbon');
    return {
      name: data.name,
      description: data.description,
      tvl: data.tvl,
      chains: data.chains,
      currentChainTvls: data.currentChainTvls,
      category: data.category,
      url: data.url,
      twitter: data.twitter,
    };
  },
});
