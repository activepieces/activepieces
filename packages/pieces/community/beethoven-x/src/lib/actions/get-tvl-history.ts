import { createAction } from '@activepieces/pieces-framework';
import { getBeethovenProtocol } from '../common/beethoven-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Get the last 30 historical TVL data points for Beethoven X.',
  props: {},
  async run() {
    const data = await getBeethovenProtocol();

    const tvlArray = data.tvl as Array<{ date: number; totalLiquidityUSD: number }>;
    const last30 = tvlArray?.slice(-30) ?? [];

    return {
      history: last30.map((point) => ({
        date: new Date(point.date * 1000).toISOString().split('T')[0],
        timestamp: point.date,
        tvlUsd: point.totalLiquidityUSD,
      })),
      dataPoints: last30.length,
      startDate: last30[0]
        ? new Date(last30[0].date * 1000).toISOString().split('T')[0]
        : null,
      endDate: last30[last30.length - 1]
        ? new Date(last30[last30.length - 1].date * 1000).toISOString().split('T')[0]
        : null,
    };
  },
});
