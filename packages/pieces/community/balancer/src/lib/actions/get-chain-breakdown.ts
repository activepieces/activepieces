import { createAction } from '@activepieces/pieces-framework';
import { getProtocolData, formatUSD } from '../balancer-api';

export const getChainBreakdownAction = createAction({
  name: 'get_chain_breakdown', displayName: 'Get Chain TVL Breakdown',
  description: 'Returns the TVL breakdown for Balancer across all supported chains.',
  props: {},
  async run() {
    const data = await getProtocolData();
    const chains = Object.entries(data.chainTvls || {})
      .map(([chain, tvl]) => ({chain, tvl, tvlFormatted: formatUSD(tvl as number)}))
      .sort((a, b) => (b.tvl as number) - (a.tvl as number));
    return {totalTvl: data.tvl, totalTvlFormatted: formatUSD(data.tvl), chainCount: chains.length, chains};
  },
});
