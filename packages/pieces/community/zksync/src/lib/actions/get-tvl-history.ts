import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get-tvl-history',
  displayName: 'Get TVL History',
  description: 'Fetch the last 30 days of historical TVL data for zkSync Era from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/zksync%20era',
    });

    const data = response.body as Record<string, unknown>;
    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    if (!tvlHistory || !Array.isArray(tvlHistory)) {
      return { history: [], count: 0 };
    }

    // Get last 30 days
    const last30 = tvlHistory.slice(-30).map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      timestamp: entry.date,
      tvl_usd: entry.totalLiquidityUSD,
    }));

    const latest = last30[last30.length - 1];
    const oldest = last30[0];
    const change = latest && oldest
      ? ((latest.tvl_usd - oldest.tvl_usd) / oldest.tvl_usd) * 100
      : null;

    return {
      protocol: data['name'],
      history: last30,
      count: last30.length,
      latest_tvl: latest?.tvl_usd,
      oldest_tvl: oldest?.tvl_usd,
      change_30d_pct: change !== null ? Math.round(change * 100) / 100 : null,
    };
  },
});
