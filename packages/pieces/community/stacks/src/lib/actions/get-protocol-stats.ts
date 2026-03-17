import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key statistics for the Stacks protocol including TVL, chains, and category from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/stacks',
    });
    const data = response.body as any;
    const currentChainTvls: Record<string, number> = data['currentChainTvls'] || {};
    const tvlHistory: Array<{ date: number; totalLiquidityUSD: number }> = data['tvl'] || [];
    const now = Math.floor(Date.now() / 1000);
    const sevenDaysAgo = now - 7 * 24 * 60 * 60;
    const recentTvl = tvlHistory.filter((e) => e.date >= sevenDaysAgo).map((e) => e.totalLiquidityUSD);
    const tvlChange7d =
      recentTvl.length >= 2
        ? ((recentTvl[recentTvl.length - 1] - recentTvl[0]) / recentTvl[0]) * 100
        : null;
    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      description: data['description'],
      chains: data['chains'],
      chain_count: Array.isArray(data['chains']) ? data['chains'].length : 0,
      current_tvl_usd: data['tvl'],
      current_chain_tvls: currentChainTvls,
      tvl_change_7d_pct: tvlChange7d !== null ? Math.round(tvlChange7d * 100) / 100 : null,
      url: data['url'],
      twitter: data['twitter'],
      audit_links: data['audit_links'],
    };
  },
});
