import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get-tvl-history',
  displayName: 'Get TVL History (Last 30 Days)',
  description:
    'Fetch the last 30 days of TVL history for the Umee protocol from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/umee',
    });
    const data = response.body as Record<string, any>;
    const allTvl = (data['tvl'] as Array<{
      date: number;
      totalLiquidityUSD: number;
    }>) || [];
    const last30 = allTvl.slice(-30).map((entry) => ({
      date: new Date(entry['date'] * 1000).toISOString().split('T')[0],
      tvl_usd: entry['totalLiquidityUSD'],
    }));
    return {
      protocol: data['name'],
      history: last30,
    };
  },
});
