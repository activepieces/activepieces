import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

interface TvlDataPoint {
  date: number;
  totalLiquidityUSD: number;
}

export const getTvlHistory = createAction({
  name: 'getTvlHistory',
  displayName: 'Get TVL History',
  description:
    'Fetch the last 30 days of historical Total Value Locked (TVL) data for Orca from DeFiLlama.',
  props: {},
  auth: undefined,
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/orca',
    });

    const data = response.body;
    const tvlArray = data['tvl'] as TvlDataPoint[];

    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const last30Days = tvlArray
      .filter((point) => point.date >= thirtyDaysAgo)
      .map((point) => ({
        date: new Date(point.date * 1000).toISOString().split('T')[0],
        timestamp: point.date,
        tvlUSD: point.totalLiquidityUSD,
      }));

    const latest = last30Days[last30Days.length - 1];
    const oldest = last30Days[0];
    const changePercent =
      oldest && latest
        ? ((latest.tvlUSD - oldest.tvlUSD) / oldest.tvlUSD) * 100
        : 0;

    return {
      dataPoints: last30Days,
      latestTvlUSD: latest ? latest.tvlUSD : 0,
      oldestTvlUSD: oldest ? oldest.tvlUSD : 0,
      change30dPercent: Math.round(changePercent * 100) / 100,
      dataPointCount: last30Days.length,
    };
  },
});
