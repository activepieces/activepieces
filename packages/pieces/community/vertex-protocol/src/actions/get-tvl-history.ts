import { createAction } from '@activepieces/pieces-framework';
import { fetchVertexProtocol } from '../vertex-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch the last 30 TVL data points for Vertex Protocol from DeFiLlama.',
  props: {},
  async run() {
    const data = await fetchVertexProtocol();
    const tvlArray: Array<{ date: number; totalLiquidityUSD: number }> = data.tvl ?? [];

    const last30 = tvlArray.slice(-30).map((point) => ({
      date: new Date(point.date * 1000).toISOString().split('T')[0],
      totalLiquidityUSD: point.totalLiquidityUSD,
    }));

    return { history: last30 };
  },
});
