import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Fetch a breakdown of Polygon TVL by individual chain from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/polygon',
    });
    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as
      | Record<string, number>
      | undefined;
    const chainTvlsRaw = data['chainTvls'] as Record<string, unknown> | undefined;

    const chainBreakdown: Array<{ chain: string; tvl: number }> = [];
    if (currentChainTvls) {
      for (const [chain, tvl] of Object.entries(currentChainTvls)) {
        chainBreakdown.push({ chain, tvl });
      }
      chainBreakdown.sort((a, b) => b.tvl - a.tvl);
    }

    const availableChains = chainTvlsRaw ? Object.keys(chainTvlsRaw) : [];

    return {
      name: data['name'],
      total_tvl: data['tvl'],
      chain_breakdown: chainBreakdown,
      available_chains: availableChains,
    };
  },
});
