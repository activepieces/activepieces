import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description:
    'Fetch the last 30 days of historical TVL data for Moonriver via DeFiLlama. No API key required.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/moonriver',
    });
    const data = response.body as Record<string, unknown>;
    const tvlArr = data['tvl'] as
      | Array<{ date: number; totalLiquidityUSD: number }>
      | undefined;
    const last30 = tvlArr ? tvlArr.slice(-30) : [];
    const history = last30.map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      tvl_usd: entry.totalLiquidityUSD,
    }));
    const current = history.length > 0 ? history[history.length - 1].tvl_usd : 0;
    const oldest = history.length > 0 ? history[0].tvl_usd : 0;
    return {
      protocol: data['name'],
      history,
      current_tvl_usd: current,
      tvl_change_30d_pct:
        oldest > 0 ? ((current - oldest) / oldest) * 100 : null,
      data_points: history.length,
    };
  },
});
