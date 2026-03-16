import { createAction } from '@activepieces/pieces-framework';
import { fetchDefiLlama } from '../common/dodo-api';

export const getTvlHistory = createAction({
  name: 'get-tvl-history',
  displayName: 'Get TVL History',
  description: 'Get DODO Protocol historical TVL data for the last 30 days from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const data = await fetchDefiLlama();
    const tvlHistory = data.tvl as Array<{ date: number; totalLiquidityUSD: number }>;

    const last30 = tvlHistory.slice(-30).map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      totalLiquidityUSD: entry.totalLiquidityUSD,
    }));

    return {
      history: last30,
      days: last30.length,
    };
  },
});