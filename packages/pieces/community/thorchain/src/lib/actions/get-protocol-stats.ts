import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key protocol statistics for THORChain (TVL, chains, category, raises) from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/thorchain',
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number>;
    const tvlArray = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }>;

    const totalTvl = currentChainTvls
      ? Object.values(currentChainTvls).reduce((sum: number, v: number) => sum + v, 0)
      : null;

    const latestTvlEntry =
      Array.isArray(tvlArray) && tvlArray.length > 0
        ? tvlArray[tvlArray.length - 1]
        : null;

    const chains = data['chains'] as string[];

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
      current_tvl_usd: totalTvl,
      defillama_tvl: latestTvlEntry ? latestTvlEntry.totalLiquidityUSD : null,
      chains: chains ?? [],
      chain_count: chains ? chains.length : 0,
      slug: data['slug'],
      gecko_id: data['gecko_id'],
      cmcId: data['cmcId'],
      raises: data['raises'] ?? [],
    };
  },
});
