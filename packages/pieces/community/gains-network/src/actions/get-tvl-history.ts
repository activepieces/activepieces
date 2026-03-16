import { createAction } from '@activepieces/pieces-framework';
import { fetchGainsProtocol } from '../gains-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch the last 30 TVL data points for Gains Network from DeFiLlama.',
  props: {},
  async run() {
    const data = await fetchGainsProtocol();
    const tvlArray: Array<{ date: number; totalLiquidityUSD: number }> = data.tvl || [];

    const last30 = tvlArray.slice(-30).map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      totalLiquidityUSD: entry.totalLiquidityUSD,
    }));

    return { history: last30 };
  },
});
