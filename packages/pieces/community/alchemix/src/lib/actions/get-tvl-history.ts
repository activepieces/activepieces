import { createAction } from '@activepieces/pieces-framework';
import { getAlchemixProtocol } from '../alchemix-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Get last 30 days of TVL history for Alchemix',
  auth: undefined,
  props: {},
  async run() {
    const data = await getAlchemixProtocol();
    const tvlHistory: Array<{ date: number; totalLiquidityUSD: number }> = data.tvl || [];
    const last30 = tvlHistory.slice(-30).map((e) => ({
      date: new Date(e.date * 1000).toISOString().split('T')[0],
      tvl_usd: e.totalLiquidityUSD,
    }));
    return { history: last30 };
  },
});
