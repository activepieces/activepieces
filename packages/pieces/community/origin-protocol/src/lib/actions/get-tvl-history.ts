import { createAction, Property } from '@activepieces/pieces-framework';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Get historical TVL data for Origin Protocol from DeFiLlama',
  auth: undefined,
  props: {
    days: Property.Number({
      displayName: 'Number of Days',
      description: 'Number of historical days to return (default: 30)',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const days = context.propsValue.days ?? 30;

    const response = await fetch('https://api.llama.fi/protocol/origin-protocol');
    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    const tvlArray: Array<{ date: number; totalLiquidityUSD: number }> = data.tvl ?? [];
    const cutoffTime = Date.now() / 1000 - days * 86400;

    const history = tvlArray
      .filter((entry) => entry.date >= cutoffTime)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        tvlUsd: entry.totalLiquidityUSD,
      }));

    return {
      name: data.name,
      daysRequested: days,
      dataPoints: history.length,
      history,
    };
  },
});
