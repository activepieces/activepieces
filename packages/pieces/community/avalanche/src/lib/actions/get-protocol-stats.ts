import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getProtocolStatsAction = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Fetch key protocol statistics for the Avalanche ecosystem including TVL, chain count, category, and recent changes from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/avalanche',
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = (data['currentChainTvls'] ?? {}) as Record<string, number>;
    const chainList = data['chains'] as string[] | undefined;

    const tvlHistory = (data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined) ?? [];
    const sorted = [...tvlHistory].sort((a, b) => b.date - a.date);
    const latest = sorted[0]?.totalLiquidityUSD ?? null;
    const oneDayAgo = sorted.find((e) => e.date <= Math.floor(Date.now() / 1000) - 86400);
    const sevenDaysAgo = sorted.find((e) => e.date <= Math.floor(Date.now() / 1000) - 7 * 86400);

    const pct = (now: number | null, prev: number | null | undefined) =>
      now && prev && prev !== 0
        ? parseFloat((((now - prev) / prev) * 100).toFixed(2))
        : null;

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      description: data['description'],
      url: data['url'],
      chains: chainList,
      chainCount: chainList?.length ?? Object.keys(currentChainTvls).length,
      currentTvlUsd: latest,
      change24hPercent: pct(latest, oneDayAgo?.totalLiquidityUSD),
      change7dPercent: pct(latest, sevenDaysAgo?.totalLiquidityUSD),
      currentChainTvls,
    };
  },
});
