import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Get the last 30 days of historical TVL data for Mantle Network from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/mantle',
    });

    const data = response.body as Record<string, unknown>;
    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    if (!tvlHistory || tvlHistory.length === 0) {
      return { history: [], data_points: 0 };
    }

    // Return last 30 data points
    const last30 = tvlHistory.slice(-30);

    const history = last30.map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      timestamp: entry.date,
      tvl_usd: entry.totalLiquidityUSD,
    }));

    const latest = history[history.length - 1];
    const oldest = history[0];
    const tvlChange = latest && oldest
      ? ((latest.tvl_usd - oldest.tvl_usd) / oldest.tvl_usd) * 100
      : 0;

    return {
      data_points: history.length,
      period: '30 days',
      latest_tvl_usd: latest?.tvl_usd,
      oldest_tvl_usd: oldest?.tvl_usd,
      tvl_change_30d_percent: Math.round(tvlChange * 100) / 100,
      history,
    };
  },
});
