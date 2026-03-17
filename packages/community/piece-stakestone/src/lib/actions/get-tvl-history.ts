import { Property, createAction } from '@activepieces/pieces-framework';
import { fetchProtocolDetail, formatUsd, DefiLlamaTvlHistoryPoint } from '../stakestone-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch historical TVL data for StakeStone with configurable days window and % change from baseline.',
  props: {
    days: Property.Number({
      displayName: 'Days',
      description: 'Number of days of historical TVL data to return (default: 30).',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(ctx) {
    const days = ctx.propsValue.days ?? 30;
    const protocol = await fetchProtocolDetail();

    // Extract global TVL history from the protocol detail
    const allTvlHistory: DefiLlamaTvlHistoryPoint[] = [];

    if (protocol.chainTvls) {
      // Use the first chain's history as representative, or aggregate
      const chains = Object.values(protocol.chainTvls);
      if (chains.length > 0 && chains[0].tvl) {
        // Use the total TVL series if available
        const sample = chains[0].tvl;
        allTvlHistory.push(...sample);
      }
    }

    // Filter to last N days
    const cutoffTs = Math.floor(Date.now() / 1000) - days * 86400;
    const filtered = allTvlHistory
      .filter((p) => p.date >= cutoffTs)
      .sort((a, b) => a.date - b.date);

    const baseline = filtered.length > 0 ? filtered[0].totalLiquidityUSD : 0;

    const history = filtered.map((point) => {
      const changeFromBaseline =
        baseline > 0
          ? Number((((point.totalLiquidityUSD - baseline) / baseline) * 100).toFixed(2))
          : 0;
      return {
        date: new Date(point.date * 1000).toISOString().split('T')[0],
        timestamp: point.date,
        tvl: point.totalLiquidityUSD,
        tvlFormatted: formatUsd(point.totalLiquidityUSD),
        changeFromBaseline,
        changeFromBaselineFormatted: `${changeFromBaseline >= 0 ? '+' : ''}${changeFromBaseline}%`,
      };
    });

    const latestTvl = history.length > 0 ? history[history.length - 1].tvl : protocol.tvl;
    const overallChange =
      baseline > 0
        ? Number((((latestTvl - baseline) / baseline) * 100).toFixed(2))
        : 0;

    return {
      days,
      dataPoints: history.length,
      baselineTvl: baseline,
      baselineTvlFormatted: formatUsd(baseline),
      latestTvl,
      latestTvlFormatted: formatUsd(latestTvl),
      overallChange,
      overallChangeFormatted: `${overallChange >= 0 ? '+' : ''}${overallChange}%`,
      history,
      source: 'DeFiLlama',
      timestamp: new Date().toISOString(),
    };
  },
});
