import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Fetch the last 30 days of historical TVL data for Zilliqa from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<
      Array<{ date: number; totalLiquidityUSD: number }>
    >({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/zilliqa',
    });

    // The protocol endpoint returns tvl array
    const protocolResponse = await httpClient.sendRequest<{
      tvl: Array<{ date: number; totalLiquidityUSD: number }>;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/zilliqa',
    });

    const allHistory = protocolResponse.body.tvl ?? [];
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const last30Days = allHistory
      .filter((entry) => entry.date >= thirtyDaysAgo)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvl: entry.totalLiquidityUSD,
      }));

    return {
      period: 'last_30_days',
      count: last30Days.length,
      history: last30Days,
    };
  },
});
