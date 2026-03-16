import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History (Last 30 Days)',
  description:
    'Fetch the last 30 days of historical TVL data for the Metis protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/metis',
    });

    const data = response.body as Record<string, unknown>;
    const tvlArray = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    if (!tvlArray || tvlArray.length === 0) {
      return { history: [], count: 0 };
    }

    const last30 = tvlArray.slice(-30).map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      timestamp: entry.date,
      tvl_usd: entry.totalLiquidityUSD,
    }));

    return {
      protocol: data['name'],
      history: last30,
      count: last30.length,
      latest_tvl: last30[last30.length - 1]?.tvl_usd,
      oldest_tvl: last30[0]?.tvl_usd,
    };
  },
});
