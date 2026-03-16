import { createAction } from '@activepieces/pieces-framework';
import { getProtocolData } from '../../camelot-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Get the last 30 TVL data points for Camelot DEX as date (ISO string) and totalLiquidityUSD.',
  props: {},
  async run() {
    const data = await getProtocolData();
    const tvl = data.tvl as Array<{ date: number; totalLiquidityUSD: number }>;

    const sorted = [...tvl].sort((a, b) => b.date - a.date);
    const last30 = sorted.slice(0, 30);

    const history = last30.map((entry) => ({
      date: new Date(entry.date * 1000).toISOString(),
      totalLiquidityUSD: entry.totalLiquidityUSD,
    }));

    return { history };
  },
});
