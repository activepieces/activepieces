import { createAction } from '@activepieces/pieces-framework';
import { makeRequest } from '../lib/fluid-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History (30 Days)',
  description: 'Get Fluid protocol historical TVL for the last 30 days from DeFiLlama.',
  props: {},
  async run() {
    const data = await makeRequest('/protocol/fluid');
    const tvlHistory: Array<{date: number; totalLiquidityUSD: number}> = data.tvl || [];
    const last30 = tvlHistory.slice(-30);
    return {
      history: last30.map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvl_usd: entry.totalLiquidityUSD,
      })),
      current_tvl: last30.length > 0 ? last30[last30.length - 1].totalLiquidityUSD : null,
      days_returned: last30.length,
    };
  },
});
