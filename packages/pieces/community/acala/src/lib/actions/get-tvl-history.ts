import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get-tvl-history',
  displayName: 'Get TVL History',
  description:
    'Fetch the last 30 days of historical TVL data for Acala Network from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/acala',
    });
    const data = response.body as Record<string, unknown>;
    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    if (!tvlHistory || !Array.isArray(tvlHistory)) {
      return { history: [] };
    }

    // Return the last 30 data points
    const last30 = tvlHistory.slice(-30);
    const history = last30.map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      timestamp: entry.date,
      tvl_usd: entry.totalLiquidityUSD,
    }));

    return {
      protocol: data['name'],
      history,
      oldest_date: history[0]?.date,
      latest_date: history[history.length - 1]?.date,
      latest_tvl_usd: history[history.length - 1]?.tvl_usd,
    };
  },
});
