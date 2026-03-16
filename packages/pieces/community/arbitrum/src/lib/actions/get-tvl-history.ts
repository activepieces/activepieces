import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistoryAction = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch the last 30 days of historical TVL data for Arbitrum from DeFiLlama.',
  props: {
    days: Property.Number({
      displayName: 'Number of Days',
      description: 'Number of historical days to return (default: 30, max: 90)',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const days = Math.min(Math.max(1, context.propsValue.days ?? 30), 90);

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/arbitrum',
    });

    const data = response.body as Record<string, unknown>;
    const tvlArr = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    if (!tvlArr || tvlArr.length === 0) {
      return { history: [], days_returned: 0 };
    }

    const cutoff = Date.now() / 1000 - days * 86400;
    const history = tvlArr
      .filter(entry => entry.date >= cutoff)
      .map(entry => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvl_usd: entry.totalLiquidityUSD,
      }));

    return {
      history,
      days_requested: days,
      days_returned: history.length,
    };
  },
});
