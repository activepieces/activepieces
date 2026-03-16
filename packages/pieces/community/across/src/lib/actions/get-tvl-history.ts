import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DEFILLAMA_API_BASE_URL, ACROSS_DEFILLAMA_SLUG } from '../common';

export const getTvlHistory = createAction({
  auth: PieceAuth.None(),
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description:
    'Retrieve the last 30 days of historical TVL data for Across Protocol via DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${DEFILLAMA_API_BASE_URL}/protocol/${ACROSS_DEFILLAMA_SLUG}`,
    });

    const data = response.body as Record<string, unknown>;
    const tvlArray = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    if (!tvlArray || !Array.isArray(tvlArray)) {
      return { history: [], dataPoints: 0 };
    }

    const last30 = tvlArray.slice(-30).map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      tvlUsd: entry.totalLiquidityUSD,
    }));

    const tvlValues = last30.map((e) => e.tvlUsd);
    const maxTvl = Math.max(...tvlValues);
    const minTvl = Math.min(...tvlValues);
    const latestTvl = tvlValues[tvlValues.length - 1] ?? 0;
    const oldestTvl = tvlValues[0] ?? 0;
    const change30d = oldestTvl > 0 ? ((latestTvl - oldestTvl) / oldestTvl) * 100 : 0;

    return {
      history: last30,
      dataPoints: last30.length,
      latestTvlUsd: latestTvl,
      maxTvlUsd: maxTvl,
      minTvlUsd: minTvl,
      change30dPct: parseFloat(change30d.toFixed(2)),
    };
  },
});
