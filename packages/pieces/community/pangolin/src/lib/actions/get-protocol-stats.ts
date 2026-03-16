import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getProtocolStatsAction = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Fetch key statistics for the Pangolin protocol including TVL, chain count, and category from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/pangolin',
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chains = data['chains'] as string[] | undefined;
    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    // Compute 24h and 7d TVL change if history available
    let change24h: number | null = null;
    let change7d: number | null = null;

    if (tvlHistory && tvlHistory.length > 0) {
      const latestTvl = tvlHistory[tvlHistory.length - 1]?.totalLiquidityUSD ?? 0;
      const tvl24hAgo = tvlHistory[tvlHistory.length - 2]?.totalLiquidityUSD ?? 0;
      const tvl7dAgo = tvlHistory.length >= 8 ? (tvlHistory[tvlHistory.length - 8]?.totalLiquidityUSD ?? 0) : 0;

      if (tvl24hAgo > 0) {
        change24h = parseFloat((((latestTvl - tvl24hAgo) / tvl24hAgo) * 100).toFixed(2));
      }
      if (tvl7dAgo > 0) {
        change7d = parseFloat((((latestTvl - tvl7dAgo) / tvl7dAgo) * 100).toFixed(2));
      }
    }

    return {
      name: data['name'],
      slug: data['slug'],
      symbol: data['symbol'],
      category: data['category'],
      tvl: data['tvl'] instanceof Array ? (data['tvl'] as Array<{ totalLiquidityUSD: number }>).slice(-1)[0]?.totalLiquidityUSD : data['tvl'],
      current_chain_tvls: currentChainTvls ?? {},
      chains: chains ?? [],
      chains_count: (chains ?? []).length,
      change_24h_percent: change24h,
      change_7d_percent: change7d,
      protocol_url: data['url'],
      description: data['description'],
      gecko_id: data['gecko_id'],
      cmc_id: data['cmcId'],
    };
  },
});
