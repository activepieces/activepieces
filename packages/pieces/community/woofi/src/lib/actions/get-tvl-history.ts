import { createAction } from '@activepieces/pieces-framework';
import { getWoofiProtocol } from '../common/woofi-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Get the last 30 historical TVL data points for WOOFi',
  props: {},
  async run() {
    const data = await getWoofiProtocol();
    const tvlArray: Array<{ date: number; totalLiquidityUSD: number }> = data.tvl ?? [];
    const last30 = tvlArray.slice(-30).map((point) => ({
      date: new Date(point.date * 1000).toISOString().split('T')[0],
      timestamp: point.date,
      tvl: point.totalLiquidityUSD,
    }));
    return {
      history: last30,
      data_points: last30.length,
    };
  },
});
