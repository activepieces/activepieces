import { createAction } from '@activepieces/pieces-framework';
import { getSolidlyProtocol } from '../common/solidly-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Get the last 30 historical TVL data points for the Solidly protocol.',
  auth: undefined,
  props: {},
  async run() {
    const data = await getSolidlyProtocol();
    const tvlHistory: Array<{ date: number; totalLiquidityUSD: number }> = data.tvl ?? [];

    const last30 = tvlHistory.slice(-30).map((point) => ({
      date: point.date,
      date_readable: new Date(point.date * 1000).toISOString().split('T')[0],
      tvl: point.totalLiquidityUSD,
    }));

    return {
      history: last30,
      count: last30.length,
    };
  },
});
