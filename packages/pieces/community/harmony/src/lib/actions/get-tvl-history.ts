import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

interface TvlDataPoint {
  date: number;
  totalLiquidityUSD: number;
}

interface ProtocolData {
  tvl?: TvlDataPoint[];
  name?: string;
}

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History (Last 30 Days)',
  description: 'Fetch the last 30 days of historical TVL data for the Harmony (ONE) protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<ProtocolData>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/harmony',
    });

    const data = response.body;
    const allTvl = data.tvl ?? [];

    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const last30Days = allTvl.filter(
      (point: TvlDataPoint) => point.date >= thirtyDaysAgo
    );

    return {
      name: data.name,
      history: last30Days.map((point: TvlDataPoint) => ({
        date: new Date(point.date * 1000).toISOString().split('T')[0],
        tvlUSD: point.totalLiquidityUSD,
      })),
      dataPoints: last30Days.length,
    };
  },
});
