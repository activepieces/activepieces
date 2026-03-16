import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key stats for Cronos including TVL, chains, and category from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/cronos',
    });
    const data = response.body as Record<string, unknown>;
    const chainTvls = data['chainTvls'] as Record<string, unknown> | undefined;
    const chains = chainTvls ? Object.keys(chainTvls) : [];
    const tvlArr = data['tvl'] as Array<Record<string, unknown>> | undefined;
    const currentTvl = tvlArr && tvlArr.length > 0
      ? tvlArr[tvlArr.length - 1]['totalLiquidityUSD']
      : data['tvl'];
    return {
      name: data['name'],
      category: data['category'],
      chains,
      chainCount: chains.length,
      currentTvl,
      slug: data['slug'],
      symbol: data['symbol'],
      description: data['description'],
      url: data['url'],
    };
  },
});
