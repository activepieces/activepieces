import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

type TvlPoint = {
  date: number;
  totalLiquidityUSD: number;
};

type DefiLlamaProtocol = {
  tvl: TvlPoint[];
};

export const getTvlHistory = createAction({
  name: 'get-tvl-history',
  displayName: 'Get TVL History',
  description: 'Retrieve historical TVL data for Puffer Finance for a configurable number of days.',
  auth: undefined,
  props: {
    days: Property.Number({
      displayName: 'Number of Days',
      description: 'How many days of historical TVL data to return (default: 30).',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const days = context.propsValue.days ?? 30;

    const response = await httpClient.sendRequest<DefiLlamaProtocol>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/puffer-finance',
    });

    const tvlArray = response.body.tvl ?? [];
    const sliced = tvlArray.slice(-days);

    const history = sliced.map((point) => ({
      date: new Date(point.date * 1000).toISOString().split('T')[0],
      tvl: point.totalLiquidityUSD,
    }));

    return {
      days_requested: days,
      data_points: history.length,
      history,
    };
  },
});
