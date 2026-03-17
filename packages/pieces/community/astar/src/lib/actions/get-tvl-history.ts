import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch the last 30 days of historical TVL data for Astar Network from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/astar',
    });
    const data = response.body as Record<string, unknown>;
    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;
    if (!tvlHistory || tvlHistory.length === 0) {
      return { history: [], count: 0 };
    }
    const last30 = tvlHistory.slice(-30).map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      tvl_usd: entry.totalLiquidityUSD,
    }));
    return {
      history: last30,
      count: last30.length,
      latest_tvl: last30[last30.length - 1]?.tvl_usd ?? null,
      oldest_tvl: last30[0]?.tvl_usd ?? null,
    };
  },
});
