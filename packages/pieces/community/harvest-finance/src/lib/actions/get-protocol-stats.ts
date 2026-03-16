import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get full Harvest Finance protocol statistics including TVL, chain count, category, and metadata from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/harvest-finance',
    });
    const data = response.body as Record<string, unknown>;
    const chainTvls = data['chainTvls'] as Record<string, unknown> | undefined;
    const chains = data['chains'] as string[] | undefined;
    const tvlArr = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;
    const latestTvl = tvlArr && tvlArr.length > 0 ? tvlArr[tvlArr.length - 1]?.['totalLiquidityUSD'] : data['currentChainTvls'];

    return {
      name: data['name'],
      slug: data['slug'],
      symbol: data['symbol'],
      category: data['category'],
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
      current_tvl_usd: latestTvl,
      chain_count: chains?.length ?? (chainTvls ? Object.keys(chainTvls).length : 0),
      chains: chains ?? (chainTvls ? Object.keys(chainTvls) : []),
      audits: data['audits'],
      audit_links: data['audit_links'],
      forked_from: data['forkedFrom'],
    };
  },
});
