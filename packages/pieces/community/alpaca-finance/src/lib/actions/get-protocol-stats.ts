import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key protocol statistics for Alpaca Finance including current TVL, chain count, and category from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/alpaca-finance',
    });
    const data = response.body as Record<string, unknown>;
    const currentChainTvls = (data['currentChainTvls'] as Record<string, number>) || {};
    const totalCurrentTvl = Object.values(currentChainTvls).reduce((a, b) => a + b, 0);

    const tvlHistory = (data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }>) || [];
    const latestEntry = tvlHistory[tvlHistory.length - 1];
    const previousEntry = tvlHistory.length > 1 ? tvlHistory[tvlHistory.length - 2] : null;
    const tvlChange24h =
      latestEntry && previousEntry
        ? ((latestEntry.totalLiquidityUSD - previousEntry.totalLiquidityUSD) /
            previousEntry.totalLiquidityUSD) *
          100
        : null;

    return {
      name: data['name'],
      slug: data['slug'],
      symbol: data['symbol'],
      category: data['category'],
      description: data['description'],
      chain: data['chain'],
      chains: data['chains'],
      chain_count: Array.isArray(data['chains']) ? (data['chains'] as string[]).length : 0,
      current_tvl_usd: totalCurrentTvl,
      tvl_change_24h_pct: tvlChange24h,
      url: data['url'],
      twitter: data['twitter'],
      audit_links: data['audit_links'],
    };
  },
});
