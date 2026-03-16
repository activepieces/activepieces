import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DEFILLAMA_API_BASE_URL, BEEFY_DEFILLAMA_SLUG } from '../common';

export const getTvlHistory = createAction({
  auth: PieceAuth.None(),
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description:
    'Fetch the last 30 days of historical TVL data for Beefy Finance from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${DEFILLAMA_API_BASE_URL}/protocol/${BEEFY_DEFILLAMA_SLUG}`,
    });

    const data = response.body as Record<string, unknown>;
    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    if (!tvlHistory || !Array.isArray(tvlHistory)) {
      return { history: [], dataPoints: 0 };
    }

    // Filter last 30 days
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const last30Days = tvlHistory
      .filter((entry) => entry.date >= thirtyDaysAgo)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvlUsd: entry.totalLiquidityUSD,
      }));

    const tvlValues = last30Days.map((d) => d.tvlUsd);
    const maxTvl = tvlValues.length > 0 ? Math.max(...tvlValues) : 0;
    const minTvl = tvlValues.length > 0 ? Math.min(...tvlValues) : 0;
    const latestTvl =
      last30Days.length > 0 ? last30Days[last30Days.length - 1].tvlUsd : 0;
    const earliestTvl = last30Days.length > 0 ? last30Days[0].tvlUsd : 0;
    const change30dPercent =
      earliestTvl > 0
        ? Number((((latestTvl - earliestTvl) / earliestTvl) * 100).toFixed(2))
        : 0;

    return {
      history: last30Days,
      dataPoints: last30Days.length,
      summary: {
        latestTvlUsd: latestTvl,
        maxTvlUsd: maxTvl,
        minTvlUsd: minTvl,
        change30dPercent,
      },
    };
  },
});
