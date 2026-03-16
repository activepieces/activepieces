import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description: 'Get key protocol statistics for zkSync Era including TVL, supported chains, and category from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/zksync%20era',
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, unknown> | undefined;
    const tvlHistory = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    // Compute TVL peak
    let peakTvl = 0;
    if (tvlHistory && Array.isArray(tvlHistory)) {
      for (const entry of tvlHistory) {
        if (entry.totalLiquidityUSD > peakTvl) peakTvl = entry.totalLiquidityUSD;
      }
    }

    const chains = data['chains'] as string[] | undefined;

    return {
      name: data['name'],
      slug: data['slug'],
      symbol: data['symbol'],
      category: data['category'],
      description: data['description'],
      url: data['url'],
      twitter: data['twitter'],
      chain_count: chains?.length ?? 0,
      chains: chains,
      current_tvl_usd: Array.isArray(data['tvl'])
        ? (tvlHistory?.[tvlHistory.length - 1]?.totalLiquidityUSD ?? null)
        : data['tvl'],
      peak_tvl_usd: peakTvl || null,
      current_chain_tvls: currentChainTvls,
      audits: data['audits'],
      audit_links: data['audit_links'],
    };
  },
});
