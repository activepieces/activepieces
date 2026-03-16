import { createAction } from '@activepieces/pieces-framework';
import { getWoofiProtocol } from '../common/woofi-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Get WOOFi TVL breakdown by blockchain',
  props: {},
  async run() {
    const data = await getWoofiProtocol();
    const chainTvls = data.chainTvls ?? {};
    const breakdown = Object.entries(chainTvls).map(([chain, info]: [string, any]) => ({
      chain,
      tvl: info?.tvl ?? info,
    }));
    return {
      chains: breakdown,
      total_chains: breakdown.length,
    };
  },
});
