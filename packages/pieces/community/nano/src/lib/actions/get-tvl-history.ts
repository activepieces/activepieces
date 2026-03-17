import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistoryAction = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch Nano TVL history for the last 30 days from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/nano',
    });
    const data = response.body as Record<string, unknown>;
    const tvlHistory = (data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }>) ?? [];
    const cutoff = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const last30Days = tvlHistory.filter((entry) => entry.date >= cutoff);
    return {
      protocol: data['name'],
      history: last30Days.map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        tvl_usd: entry.totalLiquidityUSD,
      })),
      count: last30Days.length,
    };
  },
});
