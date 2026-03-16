import { createAction } from '@activepieces/pieces-framework';
import { getProtocolData } from '../../sushiswap-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Get the last 30 TVL data points for SushiSwap from DeFiLlama.',
  props: {},
  async run() {
    const data = await getProtocolData();
    const tvlHistory: Array<{ date: number; totalLiquidityUSD: number }> = data.tvl ?? [];

    const last30 = tvlHistory.slice(-30).map((point) => ({
      date: new Date(point.date * 1000).toISOString(),
      totalLiquidityUSD: point.totalLiquidityUSD,
    }));

    return { history: last30 };
  },
});
