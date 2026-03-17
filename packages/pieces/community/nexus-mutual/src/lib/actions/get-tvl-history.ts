import { createAction, Property } from '@activepieces/pieces-framework';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Get historical TVL data for Nexus Mutual from DeFiLlama',
  props: {
    days: Property.Number({
      displayName: 'Days of History',
      description: 'Number of days of historical TVL data to return (default: 30)',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const days = context.propsValue.days ?? 30;

    const response = await fetch('https://api.llama.fi/protocol/nexus-mutual');
    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    const allTvl: Array<{ date: number; totalLiquidityUSD: number }> = data.tvl ?? [];
    const cutoff = Date.now() / 1000 - days * 86400;
    const filtered = allTvl.filter((entry) => entry.date >= cutoff);

    const history = filtered.map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      timestamp: entry.date,
      tvl_usd: entry.totalLiquidityUSD,
    }));

    return {
      protocol: data.name,
      days_requested: days,
      data_points: history.length,
      tvl_history: history,
      fetched_at: new Date().toISOString(),
    };
  },
});
