import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description:
    'Fetch the last 30 days of historical TVL data for the Polygon protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/polygon',
    });
    const data = response.body as Record<string, unknown>;
    const tvlHistory = data['tvl'] as
      | Array<{ date: number; totalLiquidityUSD: number }>
      | undefined;

    if (!tvlHistory || !Array.isArray(tvlHistory)) {
      return { history: [], count: 0 };
    }

    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const last30Days = tvlHistory
      .filter((entry) => entry.date >= thirtyDaysAgo)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvl_usd: entry.totalLiquidityUSD,
      }));

    const latestEntry = last30Days[last30Days.length - 1];
    const earliestEntry = last30Days[0];
    const changePercent =
      earliestEntry && latestEntry && earliestEntry.tvl_usd > 0
        ? (
            ((latestEntry.tvl_usd - earliestEntry.tvl_usd) /
              earliestEntry.tvl_usd) *
            100
          ).toFixed(2)
        : null;

    return {
      history: last30Days,
      count: last30Days.length,
      current_tvl: latestEntry ? latestEntry.tvl_usd : null,
      tvl_30d_change_percent: changePercent ? parseFloat(changePercent) : null,
    };
  },
});
