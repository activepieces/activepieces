import { createAction } from '@activepieces/pieces-framework';
import { defiLlamaRequest } from '../taiko-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current Total Value Locked (TVL) for the Taiko ZK-EVM rollup from DeFiLlama.',
  props: {},
  async run() {
    const data = await defiLlamaRequest<any>('/protocol/taiko');
    const currentTvl = data.currentChainTvls ?? data.tvl ?? null;
    return {
      name: data.name,
      symbol: data.symbol,
      description: data.description,
      category: data.category,
      currentTvl,
      chains: data.chains,
      url: data.url,
      twitter: data.twitter,
    };
  },
});
