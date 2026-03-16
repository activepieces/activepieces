import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DEFILLAMA_API_BASE_URL, MULTICHAIN_DEFILLAMA_SLUG } from '../common';

export const getTvlHistory = createAction({
  auth: PieceAuth.None(),
  name: 'get_tvl_history',
  displayName: 'Get TVL History (30 Days)',
  description:
    'Fetch the last 30 days of historical TVL data for Multichain via DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${DEFILLAMA_API_BASE_URL}/protocol/${MULTICHAIN_DEFILLAMA_SLUG}`,
    });

    const data = response.body as Record<string, unknown>;
    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    if (!tvlHistory || !Array.isArray(tvlHistory)) {
      return { history: [], dataPoints: 0 };
    }

    const last30 = tvlHistory.slice(-30).map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      tvlUsd: entry.totalLiquidityUSD,
    }));

    const first = last30[0];
    const last = last30[last30.length - 1];
    const changePercent =
      first && last && first.tvlUsd > 0
        ? (((last.tvlUsd - first.tvlUsd) / first.tvlUsd) * 100).toFixed(2)
        : null;

    return {
      history: last30,
      dataPoints: last30.length,
      latestTvlUsd: last?.tvlUsd ?? null,
      oldestTvlUsd: first?.tvlUsd ?? null,
      changePercent30d: changePercent ? parseFloat(changePercent) : null,
    };
  },
});
