import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getTvlHistoryAction = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History (Last 30 Days)',
  description:
    'Fetch the last 30 days of historical Total Value Locked (TVL) data for the Avalanche ecosystem from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/avalanche',
    });

    const data = response.body as Record<string, unknown>;
    const tvlHistory = (data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined) ?? [];

    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const last30 = tvlHistory
      .filter((entry) => entry.date >= thirtyDaysAgo)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        tvlUsd: entry.totalLiquidityUSD,
      }));

    const tvlValues = last30.map((e) => e.tvlUsd);
    const minTvl = tvlValues.length > 0 ? Math.min(...tvlValues) : null;
    const maxTvl = tvlValues.length > 0 ? Math.max(...tvlValues) : null;
    const avgTvl =
      tvlValues.length > 0
        ? tvlValues.reduce((a, b) => a + b, 0) / tvlValues.length
        : null;

    const first = last30[0]?.tvlUsd ?? null;
    const last = last30[last30.length - 1]?.tvlUsd ?? null;
    const changePercent =
      first && last && first !== 0
        ? (((last - first) / first) * 100).toFixed(2)
        : null;

    return {
      dataPoints: last30.length,
      minTvlUsd: minTvl,
      maxTvlUsd: maxTvl,
      avgTvlUsd: avgTvl ? Math.round(avgTvl) : null,
      changePercent30d: changePercent ? parseFloat(changePercent) : null,
      history: last30,
    };
  },
});
