import { createAction, Property } from '@activepieces/pieces-framework';
import { getProtocolData, formatUSD } from '../frax-ether-api';

export const getTvlHistory = createAction({
  name: 'get-tvl-history',
  displayName: 'Get TVL History',
  description: 'Fetch historical TVL data for Frax Ether with configurable days and % change from baseline.',
  props: {
    days: Property.Number({
      displayName: 'Days',
      description: 'Number of historical days to fetch (default: 30)',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const data = await getProtocolData();
    const days = context.propsValue.days ?? 30;

    const tvlHistory: Array<{ date: number; totalLiquidityUSD: number }> = data.tvl;
    const cutoffTime = Math.floor(Date.now() / 1000) - days * 86400;
    const filtered = tvlHistory.filter((entry: { date: number }) => entry.date >= cutoffTime);

    const baseline = filtered.length > 0 ? filtered[0].totalLiquidityUSD : 0;
    const latest = filtered.length > 0 ? filtered[filtered.length - 1].totalLiquidityUSD : 0;
    const overallChange = baseline > 0 ? ((latest - baseline) / baseline) * 100 : 0;

    const history = filtered.map((entry: { date: number; totalLiquidityUSD: number }) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      timestamp: entry.date,
      tvl: entry.totalLiquidityUSD,
      tvl_formatted: formatUSD(entry.totalLiquidityUSD),
      change_from_baseline_percent: baseline > 0
        ? parseFloat((((entry.totalLiquidityUSD - baseline) / baseline) * 100).toFixed(2))
        : 0,
    }));

    return {
      days_requested: days,
      data_points: history.length,
      baseline_tvl: baseline,
      baseline_tvl_formatted: formatUSD(baseline),
      current_tvl: latest,
      current_tvl_formatted: formatUSD(latest),
      overall_change_percent: parseFloat(overallChange.toFixed(2)),
      history,
    };
  },
});
