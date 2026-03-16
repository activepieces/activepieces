import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get-tvl-history',
  displayName: 'Get TVL History (Last 30 Days)',
  description:
    'Fetch the last 30 days of historical Total Value Locked data for Maple Finance via DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/maple',
    });

    const data = response.body as Record<string, unknown>;
    const tvlArr = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }>;

    if (!Array.isArray(tvlArr)) {
      return { history: [], count: 0 };
    }

    // Last 30 data points
    const last30 = tvlArr.slice(-30).map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      timestamp: entry.date,
      tvl_usd: entry.totalLiquidityUSD,
    }));

    const latest = last30[last30.length - 1];
    const oldest = last30[0];
    const change =
      oldest && latest
        ? ((latest.tvl_usd - oldest.tvl_usd) / oldest.tvl_usd) * 100
        : 0;

    return {
      history: last30,
      count: last30.length,
      latest_tvl_usd: latest?.tvl_usd ?? 0,
      oldest_tvl_usd: oldest?.tvl_usd ?? 0,
      change_30d_percent: Math.round(change * 100) / 100,
    };
  },
});
