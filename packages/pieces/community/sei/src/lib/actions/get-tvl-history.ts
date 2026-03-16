import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get-tvl-history',
  displayName: 'Get TVL History (Last 30 Days)',
  description: 'Fetch the last 30 days of historical TVL data for Sei Network from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/sei',
    });
    const data = response.body as Record<string, unknown>;
    const tvlArr = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    if (!tvlArr || tvlArr.length === 0) {
      return { history: [], data_points: 0 };
    }

    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60;

    const last30Days = tvlArr
      .filter((entry) => entry.date >= thirtyDaysAgo)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvl_usd: entry.totalLiquidityUSD,
      }));

    const latest = last30Days[last30Days.length - 1];
    const earliest = last30Days[0];
    const tvlChange =
      earliest && latest && earliest.tvl_usd > 0
        ? (((latest.tvl_usd - earliest.tvl_usd) / earliest.tvl_usd) * 100).toFixed(2)
        : null;

    return {
      protocol: data['name'],
      data_points: last30Days.length,
      tvl_change_30d_percent: tvlChange ? parseFloat(tvlChange) : null,
      current_tvl_usd: latest?.tvl_usd ?? null,
      tvl_30d_ago_usd: earliest?.tvl_usd ?? null,
      history: last30Days,
    };
  },
});
