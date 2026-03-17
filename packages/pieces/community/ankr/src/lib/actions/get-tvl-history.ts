import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Get the historical TVL data for Ankr Network over the last N days from DeFiLlama.',
  props: {
    days: Property.Number({
      displayName: 'Number of Days',
      description: 'Number of days of history to retrieve (default: 30).',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const days = context.propsValue.days ?? 30;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/ankr',
    });

    const data = response.body as Record<string, unknown>;
    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }>;

    if (!tvlHistory || tvlHistory.length === 0) {
      return { history: [] };
    }

    const cutoffDate = Math.floor(Date.now() / 1000) - days * 86400;
    const filtered = tvlHistory
      .filter((entry) => entry.date >= cutoffDate)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        tvl_usd: entry.totalLiquidityUSD,
      }));

    return {
      protocol: 'Ankr',
      days_requested: days,
      data_points: filtered.length,
      history: filtered,
    };
  },
});
