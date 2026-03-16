import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key statistics for the TON protocol: current TVL, category, chains, and more from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/ton',
    });
    const data = response.body as Record<string, unknown>;
    const tvlArr = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }>;
    const currentTvl = tvlArr && tvlArr.length > 0 ? tvlArr[tvlArr.length - 1].totalLiquidityUSD : 0;
    const chains = data['chains'] as string[];

    return {
      name: data['name'],
      slug: data['slug'],
      symbol: data['symbol'],
      category: data['category'],
      current_tvl_usd: currentTvl,
      chains,
      chain_count: chains ? chains.length : 0,
      description: data['description'],
      website: data['url'],
      twitter: data['twitter'],
      audit_links: data['audit_links'],
      github: data['github'],
    };
  },
});
