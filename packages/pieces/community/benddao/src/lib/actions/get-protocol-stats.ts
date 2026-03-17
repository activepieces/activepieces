import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetches key BendDAO protocol statistics including TVL, chains, category, and more from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/benddao',
    });

    const data = response.body;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chains = data['chains'] as string[] | undefined;
    const tvlArray = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    const latestTvl =
      tvlArray && tvlArray.length > 0
        ? tvlArray[tvlArray.length - 1]?.totalLiquidityUSD
        : undefined;

    const allTimePeakEntry =
      tvlArray && tvlArray.length > 0
        ? tvlArray.reduce((max, point) =>
            point.totalLiquidityUSD > max.totalLiquidityUSD ? point : max
          )
        : undefined;

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
      current_tvl_usd: latestTvl,
      current_chain_tvls: currentChainTvls ?? {},
      chains: chains ?? [],
      chain_count: chains?.length ?? 0,
      all_time_peak_tvl_usd: allTimePeakEntry?.totalLiquidityUSD,
      all_time_peak_date: allTimePeakEntry
        ? new Date(allTimePeakEntry.date * 1000).toISOString().split('T')[0]
        : null,
    };
  },
});
