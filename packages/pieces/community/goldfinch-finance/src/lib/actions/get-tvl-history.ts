import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface TvlEntry {
  date: number;
  totalLiquidityUSD: number;
}

interface ProtocolResponse {
  tvl: TvlEntry[];
}

export const getTvlHistory = createAction({
  name: 'get-tvl-history',
  displayName: 'Get TVL History',
  description: 'Fetch historical TVL data for Goldfinch Finance from DeFiLlama.',
  props: {
    days: Property.Number({
      displayName: 'Days',
      description: 'Number of days of history to return (default: 30).',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest<ProtocolResponse>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/goldfinch',
    });

    const allHistory = response.body.tvl ?? [];
    const days = context.propsValue.days ?? 30;
    const history = allHistory.slice(-days).map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      timestamp: entry.date,
      tvlUsd: entry.totalLiquidityUSD,
    }));

    return {
      days,
      count: history.length,
      history,
    };
  },
});
