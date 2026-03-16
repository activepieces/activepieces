import { createAction, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DEFILLAMA_API_BASE_URL, BEEFY_DEFILLAMA_SLUG } from '../common';

export const getProtocolStats = createAction({
  auth: PieceAuth.None(),
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Fetch key protocol statistics for Beefy Finance including current TVL, number of supported chains, and protocol category.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${DEFILLAMA_API_BASE_URL}/protocol/${BEEFY_DEFILLAMA_SLUG}`,
    });

    const data = response.body as Record<string, unknown>;
    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;
    const chains = data['chains'] as string[] | undefined;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;

    // Compute current TVL from latest history entry
    const latestEntry =
      tvlHistory && tvlHistory.length > 0
        ? tvlHistory[tvlHistory.length - 1]
        : null;
    const currentTvl = latestEntry ? latestEntry.totalLiquidityUSD : 0;

    // Compute 7-day change
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;
    const entrySevenDaysAgo = tvlHistory
      ? tvlHistory.filter((e) => e.date <= sevenDaysAgo).pop()
      : null;
    const tvl7dChange =
      entrySevenDaysAgo && entrySevenDaysAgo.totalLiquidityUSD > 0
        ? Number(
            (
              ((currentTvl - entrySevenDaysAgo.totalLiquidityUSD) /
                entrySevenDaysAgo.totalLiquidityUSD) *
              100
            ).toFixed(2)
          )
        : null;

    return {
      name: data['name'],
      category: data['category'],
      currentTvlUsd: currentTvl,
      chainCount: chains ? chains.length : 0,
      chains: chains || [],
      tvl7dChangePercent: tvl7dChange,
      topChainsByTvl: currentChainTvls
        ? Object.entries(currentChainTvls)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([chain, tvl]) => ({ chain, tvlUsd: tvl }))
        : [],
      url: data['url'],
      twitter: data['twitter'],
    };
  },
});
