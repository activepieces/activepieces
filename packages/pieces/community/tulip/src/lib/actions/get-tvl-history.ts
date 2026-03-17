import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History (Last 30 Days)',
  description: 'Fetch the last 30 days of historical TVL data for Tulip Protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/tulip',
    });
    const data = response.body as Record<string, unknown>;
    const tvlArr = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    if (!tvlArr || tvlArr.length === 0) {
      return { history: [], data_points: 0 };
    }

    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const recent = tvlArr
      .filter((entry) => entry.date >= thirtyDaysAgo)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvl_usd: entry.totalLiquidityUSD,
      }));

    const latest = recent[recent.length - 1];
    const oldest = recent[0];
    const change =
      oldest && latest && oldest.tvl_usd !== 0
        ? (((latest.tvl_usd - oldest.tvl_usd) / oldest.tvl_usd) * 100).toFixed(2)
        : null;

    return {
      history: recent,
      data_points: recent.length,
      latest_tvl_usd: latest?.tvl_usd ?? null,
      oldest_tvl_usd: oldest?.tvl_usd ?? null,
      tvl_change_30d_percent: change !== null ? parseFloat(change) : null,
    };
  },
});
