import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key protocol statistics for Celo from DeFiLlama including TVL, chains, and category.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/celo',
    });

    const data = response.body as Record<string, unknown>;
    const tvlArray = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;
    const chainTvls = (data['chainTvls'] as Record<string, unknown>) ?? {};
    const chains = data['chains'] as string[] | undefined;

    const latestTvl =
      tvlArray && tvlArray.length > 0
        ? tvlArray[tvlArray.length - 1]
        : null;

    const allTimePeak = tvlArray
      ? tvlArray.reduce(
          (max, entry) =>
            entry.totalLiquidityUSD > max.totalLiquidityUSD ? entry : max,
          tvlArray[0]
        )
      : null;

    return {
      name: data['name'],
      slug: data['slug'],
      category: data['category'],
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
      current_tvl_usd: latestTvl ? latestTvl.totalLiquidityUSD : null,
      tvl_last_updated: latestTvl
        ? new Date(latestTvl.date * 1000).toISOString()
        : null,
      all_time_peak_tvl_usd: allTimePeak ? allTimePeak.totalLiquidityUSD : null,
      all_time_peak_date: allTimePeak
        ? new Date(allTimePeak.date * 1000).toISOString()
        : null,
      chains: chains ?? Object.keys(chainTvls),
      chain_count: chains ? chains.length : Object.keys(chainTvls).length,
    };
  },
});
