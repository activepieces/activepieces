import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistoryAction = createAction({
  name: 'get-tvl-history',
  displayName: 'Get TVL History',
  description: 'Fetch the last 30 days of historical TVL data for X2Y2 from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/x2y2',
    });

    const data = response.body as Record<string, unknown>;
    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    if (!tvlHistory || tvlHistory.length === 0) {
      return { history: [], count: 0 };
    }

    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const recentHistory = tvlHistory
      .filter((entry) => entry.date >= thirtyDaysAgo)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvlUsd: entry.totalLiquidityUSD,
      }));

    const latestEntry = recentHistory[recentHistory.length - 1];
    const earliestEntry = recentHistory[0];
    const tvlChange =
      latestEntry && earliestEntry
        ? latestEntry.tvlUsd - earliestEntry.tvlUsd
        : null;

    return {
      history: recentHistory,
      count: recentHistory.length,
      latestTvlUsd: latestEntry?.tvlUsd ?? null,
      tvlChange30dUsd: tvlChange,
    };
  },
});
