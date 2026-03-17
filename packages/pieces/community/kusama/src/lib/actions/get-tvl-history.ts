import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get-tvl-history',
  displayName: 'Get TVL History',
  description: 'Fetch the last 30 days of historical TVL data for Kusama from DeFiLlama.',
  props: {
    days: Property.Number({
      displayName: 'Number of Days',
      description: 'How many recent days of TVL history to return (max 365).',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const days = Math.min(Math.max(1, context.propsValue.days ?? 30), 365);

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/kusama',
    });

    const data = response.body as Record<string, unknown>;
    const tvlArr = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    if (!tvlArr || tvlArr.length === 0) {
      return { protocol: data['name'], history: [] };
    }

    const history = tvlArr
      .slice(-days)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        tvl_usd: entry.totalLiquidityUSD,
      }));

    return {
      protocol: data['name'],
      days_returned: history.length,
      history,
    };
  },
});
