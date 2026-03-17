import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface TvlDataPoint {
  date: number;
  totalLiquidityUSD: number;
}

interface ProtocolResponse {
  tvl: TvlDataPoint[];
}

export const getTvlHistory = createAction({
  name: 'get-tvl-history',
  displayName: 'Get TVL History',
  description: 'Fetches the historical TVL data for Ondo Finance from DeFiLlama.',
  props: {
    days: Property.Number({
      displayName: 'Number of Days',
      description: 'How many days of history to return (default: 30).',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const days = context.propsValue.days ?? 30;

    const response = await httpClient.sendRequest<ProtocolResponse>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/ondo-finance',
    });

    const allTvl = response.body.tvl;
    const sliced = allTvl.slice(-Math.abs(days));

    return {
      days_returned: sliced.length,
      history: sliced.map((point) => ({
        date: new Date(point.date * 1000).toISOString().split('T')[0],
        timestamp: point.date,
        tvl_usd: point.totalLiquidityUSD,
      })),
    };
  },
});
