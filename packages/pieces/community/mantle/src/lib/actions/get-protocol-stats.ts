import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Get key protocol statistics for Mantle Network including TVL, chains, and category from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/mantle',
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    // Current TVL
    const currentTvl = data['tvl'];

    // TVL 7d ago
    let tvl7dAgo: number | null = null;
    let tvlChange7d: number | null = null;
    if (tvlHistory && tvlHistory.length >= 7) {
      const entry7d = tvlHistory[tvlHistory.length - 7];
      if (entry7d) {
        tvl7dAgo = entry7d.totalLiquidityUSD;
        const latest = tvlHistory[tvlHistory.length - 1];
        if (latest) {
          tvlChange7d = Math.round(((latest.totalLiquidityUSD - tvl7dAgo) / tvl7dAgo) * 10000) / 100;
        }
      }
    }

    // Chain count
    const chainCount = currentChainTvls ? Object.keys(currentChainTvls).length : 0;

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      chains: data['chains'],
      chain_count: chainCount,
      current_tvl_usd: currentTvl,
      tvl_7d_ago_usd: tvl7dAgo,
      tvl_change_7d_percent: tvlChange7d,
      gecko_id: data['gecko_id'],
      cmcId: data['cmcId'],
      twitter: data['twitter'],
      url: data['url'],
    };
  },
});
