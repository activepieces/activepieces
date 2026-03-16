import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History (30 Days)',
  description: 'Fetch the last 30 days of historical TVL data for the TON protocol from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/ton',
    });
    const data = response.body as Record<string, unknown>;
    const tvlArr = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }>;

    if (!tvlArr || tvlArr.length === 0) {
      return { history: [], data_points: 0 };
    }

    const last30 = tvlArr.slice(-30);
    const history = last30.map(entry => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      timestamp: entry.date,
      tvl_usd: entry.totalLiquidityUSD,
    }));

    const current = history[history.length - 1]?.tvl_usd ?? 0;
    const earliest = history[0]?.tvl_usd ?? 0;
    const change30d = earliest > 0 ? ((current - earliest) / earliest) * 100 : 0;

    return {
      protocol: data['name'],
      history,
      data_points: history.length,
      current_tvl_usd: current,
      tvl_30d_ago_usd: earliest,
      change_30d_percent: Math.round(change30d * 100) / 100,
    };
  },
});
