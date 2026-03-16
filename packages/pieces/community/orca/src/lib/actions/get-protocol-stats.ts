import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

interface TvlDataPoint {
  date: number;
  totalLiquidityUSD: number;
}

export const getProtocolStats = createAction({
  name: 'getProtocolStats',
  displayName: 'Get Protocol Stats',
  description:
    'Get key protocol statistics for Orca including TVL, chains, category, and description from DeFiLlama.',
  props: {},
  auth: undefined,
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/orca',
    });

    const data = response.body;
    const tvlArray = data['tvl'] as TvlDataPoint[];
    const latestTvl =
      tvlArray && tvlArray.length > 0
        ? tvlArray[tvlArray.length - 1].totalLiquidityUSD
        : 0;

    const currentChainTvls = data['currentChainTvls'] as Record<
      string,
      number
    >;
    const chains = data['chains'] as string[];

    const allTimeHighEntry =
      tvlArray && tvlArray.length > 0
        ? tvlArray.reduce((max, point) =>
            point.totalLiquidityUSD > max.totalLiquidityUSD ? point : max
          )
        : null;

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      description: data['description'],
      currentTvlUSD: latestTvl,
      chains,
      chainCount: chains ? chains.length : 0,
      currentChainTvls,
      allTimeHighTvlUSD: allTimeHighEntry
        ? allTimeHighEntry.totalLiquidityUSD
        : 0,
      allTimeHighDate: allTimeHighEntry
        ? new Date(allTimeHighEntry.date * 1000).toISOString().split('T')[0]
        : null,
      url: data['url'],
      twitter: data['twitter'],
      gecko_id: data['gecko_id'],
    };
  },
});
