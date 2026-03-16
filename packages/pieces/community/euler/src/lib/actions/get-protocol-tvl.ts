import { createAction } from '@activepieces/pieces-framework';
import { eulerRequest } from '../euler-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get total value locked in Euler Finance from DeFiLlama',
  auth: undefined,
  props: {},
  async run() {
    const data = await eulerRequest('https://api.llama.fi/protocol/euler');
    return {
      name: data.name,
      tvl: data.currentChainTvls,
      totalTvl: data.tvl?.[data.tvl.length - 1]?.totalLiquidityUSD,
      chains: data.chains,
      description: data.description,
    };
  },
});
