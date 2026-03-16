import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { getProtocolData } from '../../hmx-api';

export const getTvlHistory = createAction({
  name: 'get-tvl-history',
  displayName: 'Get TVL History',
  description: 'Get the last 30 TVL data points for HMX Protocol from DeFiLlama',
  auth: PieceAuth.None(),
  props: {},
  async run() {
    const data = await getProtocolData();
    const tvlHistory: Array<{ date: number; totalLiquidityUSD: number }> = data.tvl || [];
    const last30 = tvlHistory.slice(-30).map((entry) => ({
      date: new Date(entry.date * 1000).toISOString(),
      totalLiquidityUSD: entry.totalLiquidityUSD,
    }));
    return { history: last30 };
  },
});
