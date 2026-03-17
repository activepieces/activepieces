import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get-tvl-history',
  displayName: 'Get TVL History',
  description: 'Fetch the last 30 days of historical TVL for the Hedera protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/hedera',
    });

    const data = response.body as Record<string, unknown>;
    const tvlArr = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    if (!tvlArr || tvlArr.length === 0) {
      return { history: [] };
    }

    const last30 = tvlArr.slice(-30);
    const history = last30.map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      tvl_usd: entry.totalLiquidityUSD,
    }));

    const first = history[0].tvl_usd;
    const last = history[history.length - 1].tvl_usd;
    const change_pct = first > 0 ? (((last - first) / first) * 100).toFixed(2) : null;

    return {
      protocol: data['name'],
      period: '30 days',
      start_date: history[0].date,
      end_date: history[history.length - 1].date,
      start_tvl_usd: first,
      end_tvl_usd: last,
      change_percentage: change_pct ? parseFloat(change_pct) : null,
      history,
    };
  },
});
