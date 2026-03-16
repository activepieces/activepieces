import { createAction } from '@activepieces/pieces-framework';
import { getProtocolData } from '../../perp-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Get the last 30 TVL data points for Perp Protocol.',
  props: {},
  async run() {
    const data = await getProtocolData();
    // DeFiLlama returns tvl as an array of { date (unix timestamp), totalLiquidityUSD }
    const tvlArray: Array<{ date: number; totalLiquidityUSD: number }> = data.tvl ?? [];

    const last30 = tvlArray.slice(-30).map((entry) => ({
      date: new Date(entry.date * 1000).toISOString(),
      totalLiquidityUSD: entry.totalLiquidityUSD,
    }));

    return { history: last30 };
  },
});
