import { Property, createAction } from '@activepieces/pieces-framework';
import { getProtocolData, formatUSD } from '../prisma-finance-api';

export const getTvlHistoryAction = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description:
    'Fetches historical TVL data for a configurable number of days, including percentage change from the baseline.',
  props: {
    days: Property.Number({
      displayName: 'Days',
      description: 'Number of historical days to retrieve (default: 30).',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const days = context.propsValue.days ?? 30;
    const data = await getProtocolData();

    const tvlList = data.tvlList || [];

    const nowMs = Date.now();
    const cutoffMs = nowMs - days * 24 * 60 * 60 * 1000;

    const filtered = tvlList
      .filter((entry) => entry.date * 1000 >= cutoffMs)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvl: entry.totalLiquidityUSD,
        tvlFormatted: formatUSD(entry.totalLiquidityUSD),
      }));

    const baselineTvl =
      filtered.length > 0 ? filtered[0].tvl : null;
    const currentTvl =
      filtered.length > 0 ? filtered[filtered.length - 1].tvl : null;

    let changeFromBaseline: number | null = null;
    if (baselineTvl !== null && currentTvl !== null && baselineTvl > 0) {
      changeFromBaseline = parseFloat(
        (((currentTvl - baselineTvl) / baselineTvl) * 100).toFixed(2)
      );
    }

    return {
      days,
      dataPoints: filtered.length,
      baselineTvl,
      baselineTvlFormatted: baselineTvl !== null ? formatUSD(baselineTvl) : null,
      currentTvl,
      currentTvlFormatted: currentTvl !== null ? formatUSD(currentTvl) : null,
      changeFromBaselinePercent: changeFromBaseline,
      history: filtered,
    };
  },
});
