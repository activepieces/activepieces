import { createAction } from '@activepieces/pieces-framework';
import { fetchVesperProtocol } from '../vesper-api';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch TVL breakdown by chain for Vesper Finance, sorted by TVL descending.',
  props: {},
  async run() {
    const data = await fetchVesperProtocol();
    const chainTvls: Record<string, any> = data.chainTvls ?? {};
    const breakdown = Object.entries(chainTvls)
      .map(([chain, info]: [string, any]) => ({
        chain,
        tvl: typeof info === 'object' && info !== null ? (info.tvl ?? 0) : (info ?? 0),
      }))
      .sort((a, b) => b.tvl - a.tvl);
    return breakdown;
  },
});
