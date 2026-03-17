import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

type TvlEntry = {
  date: number;
  totalLiquidityUSD: number;
};

type DefiLlamaProtocol = {
  tvl: TvlEntry[];
};

export const getTvlHistory = createAction({
  name: 'get-tvl-history',
  displayName: 'Get TVL History',
  description: 'Fetch historical TVL data for Renzo Protocol from DeFiLlama',
  auth: undefined,
  props: {
    days: Property.Number({
      displayName: 'Days',
      description: 'Number of days of historical TVL to return (default: 30)',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const days = context.propsValue.days ?? 30;

    const response = await httpClient.sendRequest<DefiLlamaProtocol>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/renzo',
    });

    const tvlArray = response.body.tvl ?? [];
    const sliced = tvlArray.slice(-days);

    return {
      days,
      dataPoints: sliced.length,
      history: sliced.map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvl: entry.totalLiquidityUSD,
        tvlFormatted: `$${(entry.totalLiquidityUSD / 1e9).toFixed(2)}B`,
      })),
      startTvl: sliced[0]?.totalLiquidityUSD ?? 0,
      endTvl: sliced[sliced.length - 1]?.totalLiquidityUSD ?? 0,
    };
  },
});
