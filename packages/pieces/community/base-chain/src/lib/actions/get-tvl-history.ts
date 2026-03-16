import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch the last 30 days of historical TVL data for Base from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/base',
    });

    const data = response.body as Record<string, unknown>;
    const tvlArray = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    if (!tvlArray || tvlArray.length === 0) {
      return { protocol: data['name'], history: [] };
    }

    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const history = tvlArray
      .filter((entry) => entry.date >= thirtyDaysAgo)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvl_usd: entry.totalLiquidityUSD,
      }));

    return {
      protocol: data['name'],
      days: history.length,
      history,
    };
  },
});
