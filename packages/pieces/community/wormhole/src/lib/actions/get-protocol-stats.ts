import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key statistics for Wormhole including TVL, supported chains, category, and audit info from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/wormhole',
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const tvlArray = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;
    const latestTvl = tvlArray && tvlArray.length > 0 ? tvlArray[tvlArray.length - 1] : null;

    const chainCount = currentChainTvls ? Object.keys(currentChainTvls).length : 0;
    const topChains = currentChainTvls
      ? Object.entries(currentChainTvls)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([chain, tvl]) => ({ chain, tvl }))
      : [];

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
      current_tvl_usd: latestTvl?.totalLiquidityUSD,
      supported_chain_count: chainCount,
      top_5_chains: topChains,
      audits: data['audits'],
      audit_links: data['audit_links'],
      gecko_id: data['gecko_id'],
      cmc_id: data['cmcId'],
    };
  },
});
