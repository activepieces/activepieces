import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchProtocol, calcPctChange } from '../claystack-api';

export const getTvlHistory = createAction({
  name: 'get-tvl-history',
  displayName: 'Get TVL History',
  description: 'Fetch historical TVL data for ClayStack over a configurable number of days, including percentage change from the baseline.',
  auth: undefined,
  props: {
    days: Property.Number({
      displayName: 'Days',
      description: 'Number of days of historical data to return (default: 30)',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const days = (context.propsValue.days as number) || 30;
    const protocol = await fetchProtocol();

    // Aggregate TVL from chainTvls
    const tvlByDate: Record<number, number> = {};
    for (const chainData of Object.values(protocol.chainTvls)) {
      for (const point of chainData.tvl) {
        tvlByDate[point.date] = (tvlByDate[point.date] || 0) + point.totalLiquidityUSD;
      }
    }

    const allPoints = Object.entries(tvlByDate)
      .map(([date, tvl]) => ({ date: parseInt(date), tvl_usd: tvl }))
      .sort((a, b) => a.date - b.date);

    // Filter to last N days
    const cutoff = Math.floor(Date.now() / 1000) - days * 86400;
    const filtered = allPoints.filter((p) => p.date >= cutoff);

    const baselineTvl = filtered.length > 0 ? filtered[0].tvl_usd : null;
    const currentTvl = filtered.length > 0 ? filtered[filtered.length - 1].tvl_usd : null;
    const pctChangeFromBaseline = baselineTvl && currentTvl ? calcPctChange(currentTvl, baselineTvl) : null;

    const history = filtered.map((p) => ({
      date: new Date(p.date * 1000).toISOString().split('T')[0],
      timestamp: p.date,
      tvl_usd: p.tvl_usd,
      tvl_formatted: `$${p.tvl_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      pct_change_from_baseline: baselineTvl ? parseFloat(calcPctChange(p.tvl_usd, baselineTvl)?.toFixed(2) ?? '0') : null,
    }));

    return {
      protocol: protocol.name,
      days_requested: days,
      data_points: history.length,
      baseline_tvl_usd: baselineTvl,
      current_tvl_usd: currentTvl,
      pct_change_from_baseline: pctChangeFromBaseline !== null ? parseFloat(pctChangeFromBaseline.toFixed(2)) : null,
      history,
      source: 'DeFiLlama',
    };
  },
});
