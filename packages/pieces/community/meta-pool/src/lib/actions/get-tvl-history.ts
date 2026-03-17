import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchProtocolTvl, calcPctChange } from '../meta-pool-api';

export const getTvlHistory = createAction({
  name: 'get-tvl-history',
  displayName: 'Get TVL History',
  description: 'Get historical TVL data for Meta Pool with configurable number of days and percentage change from baseline.',
  props: {
    days: Property.Number({
      displayName: 'Number of Days',
      description: 'Number of historical days to return (default: 30)',
      required: false,
      defaultValue: 30,
    }),
  },
  async run({ propsValue }) {
    const days = propsValue.days ?? 30;
    const data = await fetchProtocolTvl();

    // Aggregate TVL across all chains by date
    const tvlByDate: Record<number, number> = {};
    const chainTvls = data.chainTvls ?? {};

    for (const chainData of Object.values(chainTvls)) {
      const tvlArr = chainData.tvl ?? [];
      for (const entry of tvlArr) {
        tvlByDate[entry.date] = (tvlByDate[entry.date] ?? 0) + entry.totalLiquidityUSD;
      }
    }

    const sortedDates = Object.keys(tvlByDate)
      .map(Number)
      .sort((a, b) => a - b);

    const sliced = sortedDates.slice(-days);
    const baseline = sliced[0] ? tvlByDate[sliced[0]] : 0;

    const history = sliced.map((date, idx) => {
      const tvl = tvlByDate[date];
      const prev = idx > 0 ? tvlByDate[sliced[idx - 1]] : tvl;
      return {
        date: new Date(date * 1000).toISOString().split('T')[0],
        timestamp: date,
        tvl_usd: tvl,
        tvl_formatted: `$${tvl.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
        pct_change_from_prev: calcPctChange(tvl, prev),
        pct_change_from_baseline: calcPctChange(tvl, baseline),
      };
    });

    const currentTvl = history[history.length - 1]?.tvl_usd ?? 0;
    const baselineTvl = history[0]?.tvl_usd ?? 0;

    return {
      protocol: data.name,
      days_requested: days,
      days_returned: history.length,
      baseline_tvl_usd: baselineTvl,
      current_tvl_usd: currentTvl,
      total_pct_change: calcPctChange(currentTvl, baselineTvl),
      history,
      fetched_at: new Date().toISOString(),
    };
  },
});
