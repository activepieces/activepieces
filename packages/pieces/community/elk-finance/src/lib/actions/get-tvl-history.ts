import { createAction } from '@activepieces/pieces-framework';
import { getElkProtocol } from '../common/elk-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Get the last 30 historical TVL data points for Elk Finance.',
  auth: undefined,
  props: {},
  async run() {
    const data = await getElkProtocol();
    const tvlHistory: { date: number; totalLiquidityUSD: number }[] = data.tvl ?? [];
    const last30 = tvlHistory.slice(-30);
    return {
      history: last30.map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvl_usd: entry.totalLiquidityUSD,
      })),
      data_points: last30.length,
    };
  },
});
