import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTvlHistory = createAction({
  name: 'get_tvl_history',
  displayName: 'Get TVL History (Last 30 Days)',
  description: 'Retrieve the last 30 days of historical Total Value Locked (TVL) data for Aptos from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/aptos',
    });

    const data = response.body as Record<string, unknown>;
    const tvlArray = data['tvl'] as
      | { date: number; totalLiquidityUSD: number }[]
      | undefined;

    if (!Array.isArray(tvlArray) || tvlArray.length === 0) {
      return { history: [], count: 0 };
    }

    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const history = tvlArray
      .filter((entry) => entry.date >= thirtyDaysAgo)
      .map((entry) => ({
        date: new Date(entry.date * 1000).toISOString().split('T')[0],
        timestamp: entry.date,
        tvlUsd: entry.totalLiquidityUSD,
      }));

    const currentTvl = history.length > 0 ? history[history.length - 1].tvlUsd : null;
    const oldestTvl = history.length > 0 ? history[0].tvlUsd : null;
    const changePercent =
      oldestTvl && currentTvl
        ? (((currentTvl - oldestTvl) / oldestTvl) * 100).toFixed(2)
        : null;

    return {
      history,
      count: history.length,
      currentTvlUsd: currentTvl,
      tvlChange30dPercent: changePercent ? parseFloat(changePercent) : null,
    };
  },
});
