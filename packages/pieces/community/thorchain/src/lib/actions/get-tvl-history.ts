import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch historical TVL data for THORChain over the last N days from DeFiLlama.',
  auth: undefined,
  props: {
    days: Property.Number({
      displayName: 'Days',
      description: 'Number of past days to retrieve TVL history for (max 365).',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const days = Math.min(Number(context.propsValue.days ?? 30), 365);

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/thorchain',
    });

    const data = response.body as Record<string, unknown>;
    const tvlArray = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }>;

    if (!Array.isArray(tvlArray)) {
      return { error: 'TVL history not available', raw: data };
    }

    const cutoffTimestamp = Math.floor(Date.now() / 1000) - days * 86400;
    const filtered = tvlArray
      .filter((entry) => entry.date >= cutoffTimestamp)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvl_usd: entry.totalLiquidityUSD,
      }));

    const latestTvl = filtered.length > 0 ? filtered[filtered.length - 1].tvl_usd : null;
    const earliestTvl = filtered.length > 0 ? filtered[0].tvl_usd : null;
    const tvlChange =
      latestTvl !== null && earliestTvl !== null && earliestTvl !== 0
        ? ((latestTvl - earliestTvl) / earliestTvl) * 100
        : null;

    return {
      days_requested: days,
      data_points: filtered.length,
      latest_tvl_usd: latestTvl,
      tvl_change_percent: tvlChange !== null ? Math.round(tvlChange * 100) / 100 : null,
      history: filtered,
    };
  },
});
