import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch last 30 days of historical TVL data for Aurora from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/aurora',
    });
    const data = response.body as Record<string, unknown>;
    const tvlArray = data['tvl'] as Array<Record<string, unknown>> | undefined;

    if (!tvlArray || tvlArray.length === 0) {
      return { protocol: data['name'], history: [] };
    }

    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const history = tvlArray
      .filter((entry) => (entry['date'] as number) >= thirtyDaysAgo)
      .map((entry) => ({
        date: new Date((entry['date'] as number) * 1000).toISOString().split('T')[0],
        tvl_usd: entry['totalLiquidityUSD'],
      }));

    return {
      protocol: data['name'],
      days: history.length,
      history,
    };
  },
});
