import { createAction } from '@activepieces/pieces-framework';
import { getAbracadabraProtocol } from '../abracadabra-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Get last 30 days of TVL history for Abracadabra Money',
  auth: undefined,
  props: {},
  async run() {
    const data = await getAbracadabraProtocol();
    const tvlHistory: Array<{ date: number; totalLiquidityUSD: number }> = data.tvl || [];
    const last30 = tvlHistory.slice(-30).map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      tvl_usd: entry.totalLiquidityUSD,
    }));
    return { history: last30 };
  },
});
