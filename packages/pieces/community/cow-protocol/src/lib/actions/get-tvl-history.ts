import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Retrieve historical TVL data for CoW Protocol over the last 30 days from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/cow-protocol',
    });

    const data = response.body as Record<string, unknown>;
    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    if (!tvlHistory || tvlHistory.length === 0) {
      return { protocol: data['name'], history: [] };
    }

    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const last30Days = tvlHistory
      .filter((entry) => entry.date >= thirtyDaysAgo)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvl_usd: entry.totalLiquidityUSD,
      }));

    const latest = last30Days[last30Days.length - 1];
    const oldest = last30Days[0];
    const tvlChange =
      oldest && latest
        ? ((latest.tvl_usd - oldest.tvl_usd) / oldest.tvl_usd) * 100
        : null;

    return {
      protocol: data['name'],
      period: '30 days',
      data_points: last30Days.length,
      current_tvl_usd: latest?.tvl_usd ?? null,
      tvl_change_30d_percent: tvlChange !== null ? Math.round(tvlChange * 100) / 100 : null,
      history: last30Days,
    };
  },
});