import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DEFILLAMA_BASE_URL, STADER_PROTOCOL_SLUG } from '../common';

export const getTvlHistory = createAction({
  auth: PieceAuth.None(),
  name: 'get_tvl_history',
  displayName: 'Get TVL History (30 Days)',
  description: 'Retrieve the last 30 days of historical total value locked (TVL) data for Stader Labs using DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${DEFILLAMA_BASE_URL}/protocol/${STADER_PROTOCOL_SLUG}`,
    });

    const data = response.body as Record<string, unknown>;
    const tvlData = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    if (!tvlData || !Array.isArray(tvlData)) {
      return { history: [], data_points: 0 };
    }

    // Get the last 30 days
    const last30 = tvlData.slice(-30).map(entry => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      timestamp: entry.date,
      tvl_usd: entry.totalLiquidityUSD,
    }));

    const latest = last30[last30.length - 1];
    const oldest = last30[0];
    const change = latest && oldest
      ? ((latest.tvl_usd - oldest.tvl_usd) / oldest.tvl_usd) * 100
      : 0;

    return {
      history: last30,
      data_points: last30.length,
      current_tvl_usd: latest ? latest.tvl_usd : null,
      tvl_change_30d_percent: parseFloat(change.toFixed(2)),
    };
  },
});
