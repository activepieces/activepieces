import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface TvlEntry {
  date: number;
  totalLiquidityUSD: number;
}

interface DefiLlamaProtocol {
  name: string;
  tvl: TvlEntry[];
}

export const getTvlHistoryAction = createAction({
  name: 'get-tvl-history',
  displayName: 'Get TVL History',
  description: 'Fetch historical TVL data for Maple Finance from DeFiLlama',
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

    const response = await httpClient.sendRequest<DefiLlamaProtocol>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/maple-finance',
    });

    const allTvl = response.body.tvl ?? [];
    const sliced = allTvl.slice(-days);

    const history = sliced.map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      timestamp: entry.date,
      tvl_usd: entry.totalLiquidityUSD,
    }));

    return {
      protocol: response.body.name,
      days_returned: history.length,
      history,
    };
  },
});
