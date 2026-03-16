import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Get TVL broken down by chain for the Mantle Network protocol from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/mantle',
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chainTvls = data['chainTvls'] as Record<string, unknown> | undefined;

    // Build enriched breakdown
    const breakdown: Array<{ chain: string; tvl: number }> = [];
    if (currentChainTvls) {
      for (const [chain, tvl] of Object.entries(currentChainTvls)) {
        breakdown.push({ chain, tvl });
      }
      breakdown.sort((a, b) => b.tvl - a.tvl);
    }

    const totalTvl = breakdown.reduce((sum, item) => sum + item.tvl, 0);

    return {
      total_tvl: totalTvl,
      chain_count: breakdown.length,
      chains: breakdown,
      available_chain_details: chainTvls ? Object.keys(chainTvls) : [],
    };
  },
});
