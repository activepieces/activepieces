import { createAction } from '@activepieces/pieces-framework';
import { getAxelarProtocol } from '../axelar-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Get the last 30 days of TVL history for the Axelar Network protocol',
  auth: undefined,
  props: {},
  async run() {
    const data = await getAxelarProtocol();
    const tvlHistory: Array<{ date: number; totalLiquidityUSD: number }> = data.tvl || [];
    const last30 = tvlHistory.slice(-30).map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      tvl_usd: entry.totalLiquidityUSD,
    }));
    return { history: last30, data_points: last30.length };
  },
});
