import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStatsAction = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key protocol statistics for X2Y2 (TVL, chains, category) from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/x2y2',
    });

    const data = response.body as Record<string, unknown>;
    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    const latestTvl = tvlHistory && tvlHistory.length > 0
      ? tvlHistory[tvlHistory.length - 1]?.totalLiquidityUSD
      : null;

    const prevMonthTvl = tvlHistory && tvlHistory.length > 30
      ? tvlHistory[tvlHistory.length - 31]?.totalLiquidityUSD
      : null;

    const tvlChange30d =
      latestTvl !== null && prevMonthTvl !== null && prevMonthTvl !== 0
        ? ((latestTvl - prevMonthTvl) / prevMonthTvl) * 100
        : null;

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      chains: data['chains'],
      chainCount: (data['chains'] as string[] | undefined)?.length ?? 0,
      currentTvlUsd: latestTvl,
      tvlChange30dPercent: tvlChange30d !== null ? Number(tvlChange30d.toFixed(2)) : null,
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
      listedAt: data['listedAt'],
    };
  },
});
