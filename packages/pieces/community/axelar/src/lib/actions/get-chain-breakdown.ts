import { createAction } from '@activepieces/pieces-framework';
import { getAxelarProtocol } from '../axelar-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Get TVL breakdown by blockchain for the Axelar Network protocol',
  auth: undefined,
  props: {},
  async run() {
    const data = await getAxelarProtocol();
    const chainTvls = data.chainTvls || {};
    const breakdown = Object.entries(chainTvls)
      .map(([chain, info]: [string, any]) => ({
        chain,
        tvl: typeof info === 'object' ? info.tvl : info,
      }))
      .sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0));
    return {
      chains: breakdown,
      total_chains: breakdown.length,
    };
  },
});
