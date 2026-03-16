import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch the last 30 days of historical TVL data for Fraxtal from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/fraxtal',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = response.body as Record<string, unknown>;
    const tvlArr = data['tvl'] as Array<Record<string, number>> | undefined;

    if (!tvlArr || !Array.isArray(tvlArr)) {
      return { history: [] };
    }

    // Get last 30 data points
    const last30 = tvlArr.slice(-30);

    const history = last30.map((entry) => ({
      date: new Date(entry['date'] * 1000).toISOString().split('T')[0],
      timestamp: entry['date'],
      tvl_usd: entry['totalLiquidityUSD'],
    }));

    return {
      protocol: data['name'],
      data_points: history.length,
      history,
    };
  },
});
