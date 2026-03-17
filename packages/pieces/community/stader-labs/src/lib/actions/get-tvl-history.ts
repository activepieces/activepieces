import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchProtocolData, formatUsd, TvlHistoryEntry } from '../stader-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description:
    'Fetch historical TVL data for Stader Labs with a configurable lookback window and percentage change from baseline.',
  auth: undefined,
  props: {
    days: Property.Number({
      displayName: 'Days',
      description: 'Number of days of historical TVL to fetch (default: 30).',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const days = context.propsValue.days ?? 30;
    const data = await fetchProtocolData();

    // DeFiLlama returns per-chain TVL history; we aggregate across all chains per date
    const chainTvls = data.chainTvls ?? {};

    // Aggregate daily TVL across all chains
    const dailyMap: Record<number, number> = {};

    for (const chainData of Object.values(chainTvls)) {
      if (!chainData.tvl) continue;
      for (const entry of chainData.tvl) {
        const dateKey = entry.date;
        dailyMap[dateKey] = (dailyMap[dateKey] ?? 0) + entry.totalLiquidityUSD;
      }
    }

    // Sort by date ascending
    const sortedDates = Object.keys(dailyMap)
      .map(Number)
      .sort((a, b) => a - b);

    // Slice to last `days` entries
    const sliced = sortedDates.slice(-days);

    if (sliced.length === 0) {
      return {
        days,
        dataPoints: 0,
        history: [],
        changePercent: null,
      };
    }

    const baseline = dailyMap[sliced[0]] ?? 0;

    const history: TvlHistoryEntry[] = sliced.map((ts) => {
      const tvlUsd = dailyMap[ts] ?? 0;
      const changeFromBaseline =
        baseline > 0 ? Number((((tvlUsd - baseline) / baseline) * 100).toFixed(2)) : 0;
      return {
        date: new Date(ts * 1000).toISOString().split('T')[0],
        tvlUsd,
        changeFromBaseline,
      };
    });

    const latest = history[history.length - 1];
    const oldest = history[0];
    const totalChangePercent =
      oldest && latest && oldest.tvlUsd > 0
        ? Number((((latest.tvlUsd - oldest.tvlUsd) / oldest.tvlUsd) * 100).toFixed(2))
        : 0;

    return {
      days,
      dataPoints: history.length,
      baselineTvlUsd: baseline,
      baselineTvlFormatted: formatUsd(baseline),
      latestTvlUsd: latest?.tvlUsd ?? 0,
      latestTvlFormatted: formatUsd(latest?.tvlUsd ?? 0),
      totalChangePercent,
      history,
    };
  },
});
