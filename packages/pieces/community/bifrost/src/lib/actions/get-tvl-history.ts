import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchTvlHistory, TvlHistoryItem } from '../bifrost-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch historical TVL data for Bifrost Liquid Staking with configurable lookback period.',
  props: {
    days: Property.Number({
      displayName: 'Days',
      description: 'Number of days of historical data to return (default: 30).',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const days = context.propsValue.days ?? 30;
    const allHistory = await fetchTvlHistory();

    // Filter to the last N days
    const cutoffTimestamp = Math.floor(Date.now() / 1000) - days * 86400;
    const filtered = allHistory.filter((point) => point.date >= cutoffTimestamp);

    // Use full history if filter returns nothing (edge case)
    const dataPoints = filtered.length > 0 ? filtered : allHistory.slice(-days);

    const baselineTvl = dataPoints.length > 0 ? dataPoints[0].totalLiquidityUSD : null;

    const history: TvlHistoryItem[] = dataPoints.map((point) => {
      const changeFromBaselinePct =
        baselineTvl && baselineTvl > 0
          ? ((point.totalLiquidityUSD - baselineTvl) / baselineTvl) * 100
          : null;

      return {
        date: new Date(point.date * 1000).toISOString().split('T')[0],
        timestamp: point.date,
        tvlUSD: point.totalLiquidityUSD,
        changeFromBaselinePct:
          changeFromBaselinePct !== null
            ? parseFloat(changeFromBaselinePct.toFixed(2))
            : null,
      };
    });

    const latestTvl = history.length > 0 ? history[history.length - 1].tvlUSD : 0;
    const overallChangePct =
      baselineTvl && baselineTvl > 0
        ? ((latestTvl - baselineTvl) / baselineTvl) * 100
        : null;

    return {
      days,
      dataPoints: history.length,
      baselineTvlUSD: baselineTvl,
      latestTvlUSD: latestTvl,
      overallChangePct:
        overallChangePct !== null ? parseFloat(overallChangePct.toFixed(2)) : null,
      overallChangeFormatted:
        overallChangePct !== null
          ? `${overallChangePct >= 0 ? '+' : ''}${overallChangePct.toFixed(2)}%`
          : null,
      history,
      fetchedAt: new Date().toISOString(),
    };
  },
});
