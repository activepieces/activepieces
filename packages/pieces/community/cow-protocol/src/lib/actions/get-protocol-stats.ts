import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get key protocol statistics for CoW Protocol including TVL, supported chains, and category from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/cow-protocol',
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chains = data['chains'] as string[] | undefined;
    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    const totalTvl = currentChainTvls
      ? Object.values(currentChainTvls).reduce((sum, v) => sum + v, 0)
      : null;

    const latestTvl = tvlHistory && tvlHistory.length > 0
      ? tvlHistory[tvlHistory.length - 1]?.totalLiquidityUSD
      : null;

    return {
      name: data['name'],
      slug: data['slug'],
      symbol: data['symbol'],
      category: data['category'],
      chain_count: chains?.length ?? 0,
      chains: chains,
      current_tvl_usd: totalTvl,
      defillama_tvl_usd: latestTvl,
      description: data['description'],
      website: data['url'],
      twitter: data['twitter'],
      gecko_id: data['gecko_id'],
      cmc_id: data['cmcId'],
      audits: data['audits'],
      audit_links: data['audit_links'],
    };
  },
});