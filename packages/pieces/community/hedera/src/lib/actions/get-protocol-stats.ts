import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get-protocol-stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key stats for the Hedera protocol from DeFiLlama including TVL, chains, and category.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/hedera',
    });

    const data = response.body as Record<string, unknown>;
    const chainTvls = data['chainTvls'] as Record<string, Record<string, unknown>> | undefined;
    const tvlArr = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;

    const currentTvl = tvlArr && tvlArr.length > 0 ? tvlArr[tvlArr.length - 1].totalLiquidityUSD : 0;
    const chains = data['chains'] as string[] | undefined;

    let tvl7dAgo = null;
    let tvl30dAgo = null;
    if (tvlArr && tvlArr.length >= 8) {
      tvl7dAgo = tvlArr[tvlArr.length - 8]?.totalLiquidityUSD ?? null;
    }
    if (tvlArr && tvlArr.length >= 31) {
      tvl30dAgo = tvlArr[tvlArr.length - 31]?.totalLiquidityUSD ?? null;
    }

    const change7d = tvl7dAgo && tvl7dAgo > 0
      ? parseFloat((((currentTvl - tvl7dAgo) / tvl7dAgo) * 100).toFixed(2))
      : null;
    const change30d = tvl30dAgo && tvl30dAgo > 0
      ? parseFloat((((currentTvl - tvl30dAgo) / tvl30dAgo) * 100).toFixed(2))
      : null;

    return {
      name: data['name'],
      slug: data['slug'],
      symbol: data['symbol'],
      category: data['category'],
      description: data['description'],
      chains: chains ?? [],
      total_chains: chains ? chains.length : 0,
      current_tvl_usd: currentTvl,
      tvl_change_7d_pct: change7d,
      tvl_change_30d_pct: change30d,
      url: data['url'],
      twitter: data['twitter'],
      audit_links: data['audit_links'],
    };
  },
});
