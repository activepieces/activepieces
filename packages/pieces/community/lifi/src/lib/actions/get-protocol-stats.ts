import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getProtocolStatsAction = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description: 'Fetch key protocol statistics for Li.Fi including TVL, chains, and category from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      name: string;
      symbol: string;
      description: string;
      category: string;
      chains: string[];
      tvl: number;
      currentChainTvls: Record<string, number>;
      url: string;
      twitter: string;
      slug: string;
      mcap: number;
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/li.fi',
    });

    const data = response.body;
    const chainTvls = data.currentChainTvls || {};
    const topChains = Object.entries(chainTvls)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([chain, tvl]) => ({ chain, tvl }));

    return {
      name: data.name,
      symbol: data.symbol,
      description: data.description,
      category: data.category,
      total_tvl: data.tvl,
      chain_count: (data.chains || []).length,
      chains: data.chains,
      top_chains_by_tvl: topChains,
      market_cap: data.mcap,
      url: data.url,
      twitter: data.twitter,
      defillama_slug: data.slug,
    };
  },
});
