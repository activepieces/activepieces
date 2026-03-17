import { createAction, Property } from '@activepieces/pieces-framework';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Get historical TVL data for StakeDAO from DeFiLlama',
  auth: undefined,
  props: {
    days: Property.Number({
      displayName: 'Days',
      description: 'Number of recent days to return (default: 30)',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const response = await fetch('https://api.llama.fi/protocol/stakedao');
    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json() as Record<string, unknown>;
    const tvlArray = data['tvl'] as { date: number; totalLiquidityUSD: number }[] | undefined;

    if (!Array.isArray(tvlArray)) {
      return { history: [], count: 0 };
    }

    const days = context.propsValue.days ?? 30;
    const history = tvlArray.slice(-days).map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      tvlUsd: entry.totalLiquidityUSD,
    }));

    return {
      history,
      count: history.length,
      latestTvlUsd: history.at(-1)?.tvlUsd ?? null,
    };
  },
});
