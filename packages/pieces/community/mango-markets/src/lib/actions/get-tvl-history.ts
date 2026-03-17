import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History',
  description: 'Get the last 30 days of historical TVL data for Mango Markets from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/mango-markets',
    });

    const data = response.body as Record<string, unknown>;
    const tvlArr = (data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }>) ?? [];

    const last30 = tvlArr.slice(-30).map((entry) => ({
      date: new Date(entry.date * 1000).toISOString().split('T')[0],
      tvlUsd: entry.totalLiquidityUSD,
    }));

    const latestTvl = last30[last30.length - 1]?.tvlUsd ?? 0;
    const oldestTvl = last30[0]?.tvlUsd ?? 0;
    const changePercent =
      oldestTvl > 0
        ? (((latestTvl - oldestTvl) / oldestTvl) * 100).toFixed(2)
        : null;

    return {
      history: last30,
      latestTvlUsd: latestTvl,
      change30dPercent: changePercent,
    };
  },
});
