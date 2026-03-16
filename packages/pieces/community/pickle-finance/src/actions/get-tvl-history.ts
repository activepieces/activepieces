import { createAction } from '@activepieces/pieces-framework';
import { getTvlHistory as fetchHistory } from '../pickle-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Returns the historical TVL data for Pickle Finance from DeFiLlama. Provides time-series data of total value locked, useful for trend analysis and charting.',
  props: {},
  async run() {
    const history = await fetchHistory();

    // Return last 90 days of history
    const recent = history.slice(-90);

    const formatted = recent.map((point) => ({
      date: new Date(point.date * 1000).toISOString().split('T')[0],
      timestamp: point.date,
      tvl_usd: point.totalLiquidityUSD,
    }));

    const latest = formatted[formatted.length - 1];
    const oldest = formatted[0];
    const tvlChange = latest && oldest
      ? ((latest.tvl_usd - oldest.tvl_usd) / oldest.tvl_usd) * 100
      : null;

    return {
      history: formatted,
      summary: {
        data_points: formatted.length,
        latest_tvl_usd: latest?.tvl_usd ?? null,
        oldest_tvl_usd: oldest?.tvl_usd ?? null,
        period_change_pct: tvlChange !== null ? Math.round(tvlChange * 100) / 100 : null,
        from_date: oldest?.date ?? null,
        to_date: latest?.date ?? null,
      },
    };
  },
});
