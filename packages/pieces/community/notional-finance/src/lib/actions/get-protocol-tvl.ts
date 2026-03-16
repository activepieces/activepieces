import { createAction } from '@activepieces/pieces-framework';
import { notionalRequest } from '../notional-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get total value locked in Notional Finance from DeFiLlama',
  auth: undefined,
  props: {},
  async run() {
    const data = await notionalRequest('https://api.llama.fi/protocol/notional');
    return {
      name: data.name,
      tvl: data.currentChainTvls,
      totalTvl: data.tvl?.[data.tvl.length - 1]?.totalLiquidityUSD,
      chains: data.chains,
      description: data.description,
    };
  },
});
