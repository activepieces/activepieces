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
  description:
    "Retrieve historical TVL data for the Centrifuge protocol. Returns daily snapshots up to the specified number of days.",
  props: {
    days: Property.Number({
      displayName: 'Number of Days',
      description: 'How many days of history to return (default: 30)',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const days = context.propsValue.days ?? 30;

    const response = await httpClient.sendRequest<ProtocolResponse>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/centrifuge',
    });

    const allTvl = response.body.tvl;
    const sliced = allTvl.slice(-Math.max(1, days));

    const history = sliced.map((point) => ({
      date: new Date(point.date * 1000).toISOString().split('T')[0],
      timestamp: point.date,
      tvlUsd: point.totalLiquidityUSD,
    }));

    return {
      days,
      dataPoints: history.length,
      history,
    };
  },
});
