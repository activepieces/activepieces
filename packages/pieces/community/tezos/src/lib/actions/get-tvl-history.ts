import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch the last 30 days of historical TVL data for Tezos via DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/tezos',
    });

    const data = response.body as Record<string, unknown>;
    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    if (!tvlHistory || !Array.isArray(tvlHistory)) {
      return { history: [], count: 0 };
    }

    const last30 = tvlHistory.slice(-30).map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      timestamp: entry.date,
      tvl_usd: entry.totalLiquidityUSD,
    }));

    return {
      protocol: data['name'],
      history: last30,
      count: last30.length,
      oldest_date: last30[0]?.date,
      newest_date: last30[last30.length - 1]?.date,
    };
  },
});
