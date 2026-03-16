import { createAction } from '@activepieces/pieces-framework';
import { fetchGainsProtocol } from '../gains-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Fetch the TVL breakdown by chain for Gains Network, sorted by TVL descending.',
  props: {},
  async run() {
    const data = await fetchGainsProtocol();
    const chainTvls: Record<string, any> = data.chainTvls || {};

    const breakdown = Object.entries(chainTvls)
      .map(([chain, info]: [string, any]) => ({
        chain,
        tvl: typeof info === 'object' && info !== null ? info.tvl : info,
      }))
      .filter((entry) => typeof entry.tvl === 'number')
      .sort((a, b) => b.tvl - a.tvl);

    return { chains: breakdown };
  },
});
