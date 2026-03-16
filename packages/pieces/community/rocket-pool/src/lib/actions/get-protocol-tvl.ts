import { createAction } from '@activepieces/pieces-framework';
import { defiLlamaRequest } from '../rocket-pool-api';

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Get the current Total Value Locked (TVL) for Rocket Pool via DeFiLlama',
  props: {},
  async run() {
    const data = await defiLlamaRequest<any>('/protocol/rocket-pool');
    const currentTvl = data.currentChainTvls ?? {};
    const totalTvl = data.tvl ? data.tvl[data.tvl.length - 1]?.totalLiquidityUSD : undefined;
    return {
      name: data.name,
      symbol: data.symbol,
      description: data.description,
      totalTvlUSD: totalTvl,
      currentChainTvls: currentTvl,
      category: data.category,
      chains: data.chains,
      url: data.url,
      twitter: data.twitter,
      gecko_id: data.gecko_id,
    };
  },
});
