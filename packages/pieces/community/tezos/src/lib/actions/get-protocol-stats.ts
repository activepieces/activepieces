import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key protocol stats for Tezos including TVL, chains, and category via DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/tezos',
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    const chainCount = currentChainTvls ? Object.keys(currentChainTvls).length : 0;
    const chains = currentChainTvls ? Object.keys(currentChainTvls) : [];

    let tvlChange30d = null;
    if (tvlHistory && tvlHistory.length >= 30) {
      const current = tvlHistory[tvlHistory.length - 1]?.totalLiquidityUSD || 0;
      const thirtyDaysAgo = tvlHistory[tvlHistory.length - 30]?.totalLiquidityUSD || 0;
      if (thirtyDaysAgo > 0) {
        tvlChange30d = Math.round(((current - thirtyDaysAgo) / thirtyDaysAgo) * 10000) / 100;
      }
    }

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      description: data['description'],
      current_tvl: data['tvl'],
      chain_count: chainCount,
      chains,
      tvl_change_30d_percent: tvlChange30d,
      url: data['url'],
      twitter: data['twitter'],
      gecko_id: data['gecko_id'],
      slug: data['slug'],
    };
  },
});
