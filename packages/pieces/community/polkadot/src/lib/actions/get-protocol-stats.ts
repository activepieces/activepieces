import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key stats for Polkadot including TVL, chains, category, and metadata from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/polkadot',
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;

    // Compute total TVL from chain breakdown
    const totalTvl = currentChainTvls
      ? Object.values(currentChainTvls).reduce((sum, v) => sum + v, 0)
      : (data['tvl'] as number | undefined);

    const tvlArray = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;
    const latest = tvlArray && tvlArray.length > 0 ? tvlArray[tvlArray.length - 1] : null;
    const prev30 = tvlArray && tvlArray.length > 30 ? tvlArray[tvlArray.length - 31] : null;
    const change30d =
      prev30 && latest && prev30.totalLiquidityUSD > 0
        ? ((latest.totalLiquidityUSD - prev30.totalLiquidityUSD) / prev30.totalLiquidityUSD) * 100
        : null;

    return {
      name: data['name'],
      slug: data['slug'],
      symbol: data['symbol'],
      category: data['category'],
      chains: data['chains'],
      chain_count: Array.isArray(data['chains']) ? (data['chains'] as string[]).length : 0,
      total_tvl_usd: totalTvl,
      current_chain_tvls: currentChainTvls,
      tvl_change_30d_percent: change30d !== null ? Math.round(change30d * 100) / 100 : null,
      url: data['url'],
      twitter: data['twitter'],
      description: data['description'],
      audit_links: data['audit_links'],
    };
  },
});