import { createAction, Property } from '@activepieces/pieces-framework';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Retrieve historical TVL data points for GMX',
  props: {
    limit: Property.Number({
      displayName: 'Number of Data Points',
      description: 'How many historical data points to return (most recent first)',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const response = await fetch('https://api.llama.fi/protocol/gmx');
    if (!response.ok) throw new Error(`DeFiLlama API error: ${response.status}`);
    const data = await response.json();
    const history = (data.tvl ?? []).slice(-(context.propsValue.limit ?? 30));
    return {
      history: history.map((point: { date: number; totalLiquidityUSD: number }) => ({
        date: new Date(point.date * 1000).toISOString(),
        tvl_usd: point.totalLiquidityUSD,
      })),
      count: history.length,
    };
  },
});