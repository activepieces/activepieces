import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchProtocol } from '../rocket-pool-api';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description:
    'Fetch historical TVL data for Rocket Pool over a configurable number of days, including percentage change from baseline.',
  props: {
    days: Property.Number({
      displayName: 'Days',
      description: 'Number of historical days to return (default: 30).',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const days = (context.propsValue.days as number) || 30;
    const data = await fetchProtocol();
    const tvlHistory = data.tvl ?? [];

    const cutoff = Date.now() / 1000 - days * 86400;
    const filtered = tvlHistory.filter((entry) => entry.date >= cutoff);

    const baseline = filtered[0]?.totalLiquidityUSD ?? null;
    const latest = filtered[filtered.length - 1]?.totalLiquidityUSD ?? null;

    const pctChangeFromBaseline =
      baseline && latest && baseline > 0
        ? parseFloat((((latest - baseline) / baseline) * 100).toFixed(2))
        : null;

    return {
      protocol: data.name,
      days,
      dataPoints: filtered.length,
      baselineTvlUSD: baseline,
      latestTvlUSD: latest,
      pctChangeFromBaseline,
      history: filtered.map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        tvlUSD: entry.totalLiquidityUSD,
      })),
    };
  },
});
