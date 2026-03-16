import { createAction } from '@activepieces/pieces-framework';
import { llamaGet, GNOSIS_PROTOCOL_SLUG } from '../gnosis-api';

interface TvlDataPoint {
  date: number;
  totalLiquidityUSD: number;
}

interface ProtocolData {
  tvl?: TvlDataPoint[];
}

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Get the last 30 days of historical TVL data for the Gnosis Chain protocol from DeFiLlama.',
  props: {},
  async run() {
    const data = await llamaGet<ProtocolData>(`/protocol/${GNOSIS_PROTOCOL_SLUG}`);
    const allHistory = data.tvl ?? [];
    // Return last 30 entries
    const last30 = allHistory.slice(-30).map((point) => ({
      date: new Date(point.date * 1000).toISOString().split('T')[0],
      timestamp: point.date,
      tvl_usd: point.totalLiquidityUSD,
    }));
    return {
      count: last30.length,
      history: last30,
    };
  },
});
