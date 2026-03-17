import { createAction, Property } from '@activepieces/pieces-framework';
import { TvlHistoryEntry, fetchProtocolData } from '../origin-ether-api';

export const getTvlHistoryAction = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch historical TVL data for Origin Ether over a configurable number of days, including percentage change from the baseline.',
  props: {
    days: Property.Number({
      displayName: 'Number of Days',
      description: 'How many days of historical TVL data to return (default: 30).',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const days = context.propsValue.days ?? 30;
    const data = await fetchProtocolData();

    const allEntries = data.tvl ?? [];

    // Take the last N days
    const sliced = allEntries.slice(-Math.max(1, days));

    const baselineTvl = sliced.length > 0 ? sliced[0].totalLiquidityUSD : 0;

    const history: TvlHistoryEntry[] = sliced.map((entry) => {
      const changeFromBaseline =
        baselineTvl > 0
          ? parseFloat((((entry.totalLiquidityUSD - baselineTvl) / baselineTvl) * 100).toFixed(2))
          : 0;

      return {
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvl: entry.totalLiquidityUSD,
        changeFromBaseline,
      };
    });

    const currentTvl = history.length > 0 ? history[history.length - 1].tvl : 0;
    const overallChange =
      baselineTvl > 0
        ? parseFloat((((currentTvl - baselineTvl) / baselineTvl) * 100).toFixed(2))
        : 0;

    return {
      days,
      baselineTvlUsd: baselineTvl,
      currentTvlUsd: currentTvl,
      overallChangePercent: overallChange,
      history,
      fetchedAt: new Date().toISOString(),
    };
  },
});
