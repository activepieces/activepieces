import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch historical TVL data for the Linea protocol from DeFiLlama. Returns up to the last 30 data points by default.',
  props: {
    limit: Property.Number({
      displayName: 'Number of Data Points',
      description: 'How many historical data points to return (default: 30, max: 90)',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/linea',
      headers: {
        Accept: 'application/json',
      },
    });

    const data = response.body;
    const allTvl = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    if (!allTvl || allTvl.length === 0) {
      return { history: [], count: 0 };
    }

    const limit = Math.min(Math.max(1, context.propsValue.limit ?? 30), 90);
    const history = allTvl
      .slice(-limit)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvl_usd: entry.totalLiquidityUSD,
      }));

    return {
      protocol: data['name'],
      history,
      count: history.length,
      from: history[0]?.date,
      to: history[history.length - 1]?.date,
    };
  },
});
