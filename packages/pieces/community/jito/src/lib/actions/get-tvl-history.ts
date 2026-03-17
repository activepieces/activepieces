import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description:
    'Fetch historical TVL data for the Jito protocol from DeFiLlama. Returns the last 30 days by default.',
  props: {
    days: Property.Number({
      displayName: 'Number of Days',
      description: 'Number of past days to retrieve TVL history for (default: 30, max: 365)',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const days = Math.min(Math.max(context.propsValue.days ?? 30, 1), 365);

    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/jito',
    });

    const data = response.body as any;
    const allTvl: { date: number; totalLiquidityUSD: number }[] = data.tvl ?? [];

    // Filter to last N days
    const cutoffTimestamp = Math.floor(Date.now() / 1000) - days * 86400;
    const filtered = allTvl
      .filter((entry) => entry.date >= cutoffTimestamp)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvlUSD: entry.totalLiquidityUSD,
      }));

    const tvlValues = filtered.map((e) => e.tvlUSD);
    const maxTvl = tvlValues.length > 0 ? Math.max(...tvlValues) : null;
    const minTvl = tvlValues.length > 0 ? Math.min(...tvlValues) : null;
    const latestTvl = filtered.length > 0 ? filtered[filtered.length - 1].tvlUSD : null;
    const earliestTvl = filtered.length > 0 ? filtered[0].tvlUSD : null;
    const tvlChange =
      latestTvl !== null && earliestTvl !== null && earliestTvl !== 0
        ? ((latestTvl - earliestTvl) / earliestTvl) * 100
        : null;

    return {
      protocol: 'Jito',
      daysRequested: days,
      dataPoints: filtered.length,
      currentTvlUSD: latestTvl,
      startTvlUSD: earliestTvl,
      maxTvlUSD: maxTvl,
      minTvlUSD: minTvl,
      tvlChangePercent: tvlChange !== null ? parseFloat(tvlChange.toFixed(2)) : null,
      history: filtered,
    };
  },
});
