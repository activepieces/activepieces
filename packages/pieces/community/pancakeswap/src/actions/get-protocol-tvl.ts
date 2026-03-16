import { createAction } from '@activepieces/pieces-framework';
import { makeRequest } from '../lib/pancakeswap-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get total value locked in PancakeSwap across all chains from DeFiLlama',
  auth: undefined,
  props: {},
  async run() {
    const data = await makeRequest('/protocol/pancakeswap');

    return {
      tvl: data.tvl,
      name: data.name,
      symbol: data.symbol,
      chain: data.chain,
      chains: data.chains,
      currentChainTvls: data.currentChainTvls,
      url: data.url,
      description: data.description,
      category: data.category,
      timestamp: new Date().toISOString(),
    };
  },
});
