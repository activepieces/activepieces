import { createAction } from '@activepieces/pieces-framework';
import { getDefiLlamaProtocol } from '../port-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History (30 Days)',
  description: 'Fetch the last 30 days of historical TVL data for Port Finance from DeFiLlama.',
  props: {},
  async run() {
    const data = await getDefiLlamaProtocol();
    const tvlHistory: Array<{ date: number; totalLiquidityUSD: number }> =
      data.tvl ?? [];
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
    const recent = tvlHistory
      .filter((entry) => entry.date >= thirtyDaysAgo)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvl_usd: entry.totalLiquidityUSD,
      }));
    return {
      protocol: data.name,
      days_returned: recent.length,
      history: recent,
    };
  },
});
