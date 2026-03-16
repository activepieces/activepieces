import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History (30 Days)',
  description: 'Fetch the last 30 days of historical TVL data for the Wormhole protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/wormhole',
    });

    const data = response.body as Record<string, unknown>;
    const tvlArray = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    if (!tvlArray || tvlArray.length === 0) {
      return { history: [], data_points: 0 };
    }

    const last30 = tvlArray.slice(-30).map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      timestamp: entry.date,
      tvl_usd: entry.totalLiquidityUSD,
    }));

    const latest = last30[last30.length - 1];
    const earliest = last30[0];
    const change =
      earliest && latest
        ? ((latest.tvl_usd - earliest.tvl_usd) / earliest.tvl_usd) * 100
        : 0;

    return {
      data_points: last30.length,
      current_tvl: latest?.tvl_usd,
      tvl_30d_ago: earliest?.tvl_usd,
      change_30d_pct: parseFloat(change.toFixed(2)),
      history: last30,
    };
  },
});
