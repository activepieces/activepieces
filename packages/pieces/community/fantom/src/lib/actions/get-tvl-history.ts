import { createAction } from '@activepieces/pieces-framework';
import { defiLlamaRequest } from '../fantom-api';

interface TvlDataPoint {
  date: number;
  totalLiquidityUSD: number;
}

interface FantomProtocolWithHistory {
  tvl: TvlDataPoint[];
}

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch the last 30 days of historical TVL data for the Fantom protocol from DeFiLlama.',
  props: {},
  async run() {
    const data = await defiLlamaRequest<FantomProtocolWithHistory>('/protocol/fantom');

    const tvlHistory = data.tvl || [];
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60;

    const last30Days = tvlHistory
      .filter((entry) => entry.date >= thirtyDaysAgo)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvl_usd: entry.totalLiquidityUSD,
      }));

    const tvlValues = last30Days.map((e) => e.tvl_usd);
    const maxTvl = tvlValues.length > 0 ? Math.max(...tvlValues) : 0;
    const minTvl = tvlValues.length > 0 ? Math.min(...tvlValues) : 0;
    const avgTvl =
      tvlValues.length > 0
        ? parseFloat((tvlValues.reduce((a, b) => a + b, 0) / tvlValues.length).toFixed(2))
        : 0;

    return {
      period: '30 days',
      data_points: last30Days.length,
      max_tvl_usd: maxTvl,
      min_tvl_usd: minTvl,
      avg_tvl_usd: avgTvl,
      history: last30Days,
    };
  },
});
