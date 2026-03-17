import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch the historical TVL data for LooksRare over the last N days from DeFiLlama.',
  props: {
    days: Property.Number({
      displayName: 'Number of Days',
      description: 'Number of historical days to retrieve (e.g. 30 for last 30 days).',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const days = (context.propsValue['days'] as number) || 30;

    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/looksrare',
    });

    const data = response.body;
    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }>;

    if (!tvlHistory || tvlHistory.length === 0) {
      return { history: [], days_requested: days };
    }

    const cutoff = Math.floor(Date.now() / 1000) - days * 86400;
    const filtered = tvlHistory
      .filter((entry) => entry.date >= cutoff)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvl_usd: entry.totalLiquidityUSD,
      }));

    const tvlValues = filtered.map((e) => e.tvl_usd);
    const maxTvl = tvlValues.length > 0 ? Math.max(...tvlValues) : 0;
    const minTvl = tvlValues.length > 0 ? Math.min(...tvlValues) : 0;
    const latestTvl = tvlValues.length > 0 ? tvlValues[tvlValues.length - 1] : 0;

    return {
      history: filtered,
      days_requested: days,
      data_points: filtered.length,
      latest_tvl_usd: latestTvl,
      max_tvl_usd: maxTvl,
      min_tvl_usd: minTvl,
    };
  },
});
