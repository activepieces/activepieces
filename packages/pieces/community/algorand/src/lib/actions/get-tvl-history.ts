import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History (30 Days)',
  description:
    'Retrieve the last 30 days of Algorand total value locked (TVL) history from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/algorand',
    });
    const data = response.body as Record<string, any>;
    const tvlArray: Array<{ date: number; totalLiquidityUSD: number }> = data['tvl'] ?? [];
    const last30 = tvlArray.slice(-30).map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      tvl_usd: entry.totalLiquidityUSD,
    }));
    return {
      protocol: data['name'],
      currency: 'USD',
      days: last30.length,
      history: last30,
    };
  },
});
