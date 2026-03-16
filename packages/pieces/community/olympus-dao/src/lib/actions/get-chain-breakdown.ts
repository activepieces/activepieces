import { createAction } from '@activepieces/pieces-framework';
import { getOlympusProtocol } from '../olympus-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Get TVL breakdown by blockchain for Olympus DAO',
  auth: undefined,
  props: {},
  async run() {
    const data = await getOlympusProtocol();
    const chainTvls = data.chainTvls || {};
    const breakdown = Object.entries(chainTvls)
      .map(([chain, info]: [string, any]) => ({ chain, tvl: typeof info === 'object' ? info.tvl : info }))
      .sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0));
    return { chains: breakdown };
  },
});
