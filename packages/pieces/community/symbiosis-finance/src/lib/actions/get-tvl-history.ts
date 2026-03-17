import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Get Symbiosis Finance historical TVL data for the last 30 days from DeFiLlama',
  props: {
    days: Property.Number({
      displayName: 'Number of Days',
      description: 'Number of days of historical TVL data to retrieve (default: 30)',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(ctx) {
    const days = ctx.propsValue.days || 30;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/symbiosis-finance',
    });
    const data = response.body as Record<string, unknown>;
    const tvlArr = data['tvl'] as Array<{date: number; totalLiquidityUSD: number}>;
    if (!tvlArr || !Array.isArray(tvlArr)) {
      return { protocol: 'Symbiosis Finance', history: [] };
    }
    const history = tvlArr.slice(-days).map(entry => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      tvl: entry.totalLiquidityUSD,
    }));
    return {
      protocol: 'Symbiosis Finance',
      days_requested: days,
      history,
    };
  },
});
