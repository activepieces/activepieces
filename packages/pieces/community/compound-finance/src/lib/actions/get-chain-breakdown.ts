import { createAction } from '@activepieces/pieces-framework';
import { getChainBreakdown } from '../compound-finance-api';

export const getChainBreakdownAction = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Returns the TVL breakdown for Compound Finance across all supported chains (Ethereum, Arbitrum, Polygon, Base, etc.).',
  auth: undefined,
  props: {},
  async run() {
    const chains = await getChainBreakdown();
    const total = chains.reduce((sum, c) => sum + c.tvl, 0);
    return {
      chains: chains.map((c) => ({
        chain: c.chain,
        tvl_usd: c.tvl,
        percentage: total > 0 ? parseFloat(((c.tvl / total) * 100).toFixed(2)) : 0,
      })),
      total_tvl_usd: total,
    };
  },
});
