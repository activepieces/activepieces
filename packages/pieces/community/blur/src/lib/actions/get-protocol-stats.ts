import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key protocol statistics for Blur NFT marketplace including TVL, chains, and category from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/blur',
    });

    const data = response.body as Record<string, unknown>;
    const tvlArray = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;
    const latestTvl = tvlArray && tvlArray.length > 0 ? tvlArray[tvlArray.length - 1]?.totalLiquidityUSD : null;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      description: data['description'],
      url: data['url'],
      chains: data['chains'],
      chainCount: Array.isArray(data['chains']) ? data['chains'].length : 0,
      currentTvl: latestTvl,
      currentChainTvls,
      slug: data['slug'],
      twitter: data['twitter'],
      listedAt: data['listedAt'],
    };
  },
});
