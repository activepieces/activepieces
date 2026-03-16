import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStatsAction = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key Arbitrum protocol statistics including TVL, supported chains, and category from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/arbitrum',
    });

    const data = response.body as Record<string, unknown>;
    const tvlArr = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;
    const latestTvl = tvlArr && tvlArr.length > 0 ? tvlArr[tvlArr.length - 1] : null;

    const chainTvls = data['chainTvls'] as Record<string, unknown> | undefined;
    const chainCount = chainTvls ? Object.keys(chainTvls).length : 0;

    return {
      name: data['name'],
      slug: data['slug'],
      symbol: data['symbol'],
      category: data['category'],
      chains: data['chains'],
      chain_count: chainCount,
      current_tvl_usd: latestTvl?.totalLiquidityUSD ?? null,
      tvl_last_updated: latestTvl
        ? new Date(latestTvl.date * 1000).toISOString().split('T')[0]
        : null,
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
      gecko_id: data['gecko_id'],
    };
  },
});
