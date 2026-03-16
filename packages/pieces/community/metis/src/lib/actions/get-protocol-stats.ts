import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Fetch key statistics for the Metis protocol including TVL, chains, category, and metadata from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/metis',
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;

    const totalTvl = currentChainTvls
      ? Object.values(currentChainTvls).reduce((sum, v) => sum + v, 0)
      : (data['tvl'] as number | undefined);

    const tvlArray = data['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;
    const latestEntry = tvlArray && tvlArray.length > 0 ? tvlArray[tvlArray.length - 1] : null;
    const prevEntry = tvlArray && tvlArray.length > 1 ? tvlArray[tvlArray.length - 2] : null;

    let tvl_change_24h_pct: number | null = null;
    if (latestEntry && prevEntry && prevEntry.totalLiquidityUSD !== 0) {
      tvl_change_24h_pct =
        ((latestEntry.totalLiquidityUSD - prevEntry.totalLiquidityUSD) / prevEntry.totalLiquidityUSD) * 100;
    }

    return {
      name: data['name'],
      symbol: data['symbol'],
      category: data['category'],
      chains: data['chains'],
      chain_count: Array.isArray(data['chains']) ? (data['chains'] as unknown[]).length : 0,
      total_tvl_usd: totalTvl,
      current_chain_tvls: currentChainTvls,
      tvl_change_24h_pct,
      url: data['url'],
      twitter: data['twitter'],
      description: data['description'],
      audits: data['audits'],
      audit_links: data['audit_links'],
    };
  },
});
