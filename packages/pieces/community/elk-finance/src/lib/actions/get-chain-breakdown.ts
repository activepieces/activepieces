import { createAction } from '@activepieces/pieces-framework';
import { getElkProtocol } from '../common/elk-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Get Elk Finance TVL breakdown by blockchain network.',
  auth: undefined,
  props: {},
  async run() {
    const data = await getElkProtocol();
    const chainTvls = data.chainTvls ?? {};
    const breakdown = Object.entries(chainTvls).map(([chain, tvlData]: [string, any]) => ({
      chain,
      tvl: typeof tvlData === 'object' ? tvlData.tvl ?? null : tvlData,
    }));
    breakdown.sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0));
    return {
      chains: breakdown,
      total_chains: breakdown.length,
    };
  },
});
