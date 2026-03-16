import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get key protocol statistics (TVL, chains, category) for Aurora from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/aurora',
    });
    const data = response.body as Record<string, unknown>;
    const tvlArray = data['tvl'] as Array<Record<string, unknown>> | undefined;
    const currentTvl =
      tvlArray && tvlArray.length > 0
        ? tvlArray[tvlArray.length - 1]['totalLiquidityUSD']
        : null;

    const chainTvls = data['chainTvls'] as Record<string, unknown> | undefined;
    const chains = chainTvls ? Object.keys(chainTvls) : [];

    return {
      name: data['name'],
      slug: data['slug'],
      symbol: data['symbol'],
      category: data['category'],
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
      current_tvl_usd: currentTvl,
      chains,
      chain_count: chains.length,
      audits: data['audits'],
      audit_links: data['audit_links'],
    };
  },
});
