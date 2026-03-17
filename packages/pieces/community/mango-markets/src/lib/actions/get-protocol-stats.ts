import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get key Mango Markets protocol statistics: TVL, chains, and category from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/mango-markets',
    });

    const data = response.body as Record<string, unknown>;
    const chainTvls = (data['currentChainTvls'] ?? {}) as Record<string, number>;
    const totalTvl = Object.values(chainTvls).reduce((sum, v) => sum + v, 0);
    const tvlArr = (data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }>) ?? [];
    const allTimeHighTvl = tvlArr.reduce((max, entry) => Math.max(max, entry.totalLiquidityUSD), 0);

    return {
      name: (data['name'] as string) ?? 'Mango Markets',
      symbol: (data['symbol'] as string) ?? 'MNGO',
      category: (data['category'] as string) ?? 'Dexes',
      tvlUsd: totalTvl,
      chains: Object.keys(chainTvls),
      chainCount: Object.keys(chainTvls).length,
      allTimeHighTvlUsd: allTimeHighTvl,
      description: (data['description'] as string) ?? '',
    };
  },
});
