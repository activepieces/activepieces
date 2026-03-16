import { createAction } from '@activepieces/pieces-framework';
import { getAbracadabraProtocol } from '../abracadabra-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Get TVL breakdown by blockchain for Abracadabra Money',
  auth: undefined,
  props: {},
  async run() {
    const data = await getAbracadabraProtocol();
    const chainTvls = data.chainTvls || {};
    const breakdown = Object.entries(chainTvls)
      .map(([chain, info]: [string, any]) => ({
        chain,
        tvl: typeof info === 'object' ? info.tvl : info,
      }))
      .sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0));
    return { chains: breakdown };
  },
});
