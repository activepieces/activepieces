import { createAction } from '@activepieces/pieces-framework';
import { fetchDefiLlama } from '../klaytn-api';

export const getTvlHistoryAction = createAction({
  auth: undefined,
  name: 'get_tvl_history',
  displayName: 'Get TVL History (30 Days)',
  description:
    'Fetch the last 30 days of historical TVL data for the Klaytn protocol from DeFiLlama.',
  props: {},
  async run() {
    const data = await fetchDefiLlama<{
      tvl: { date: number; totalLiquidityUSD: number }[];
    }>('/protocol/klaytn');
    const allTvl = data.tvl ?? [];
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
    const recent = allTvl
      .filter((entry) => entry.date >= thirtyDaysAgo)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        tvl_usd: entry.totalLiquidityUSD,
      }));
    return {
      data_points: recent.length,
      history: recent,
    };
  },
});
