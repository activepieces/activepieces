import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description:
    'Get the TVL breakdown by chain for MultiversX (native vs bridged assets) from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/multiversx',
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chainTvls = data['chainTvls'] as Record<string, unknown> | undefined;

    const breakdown: Array<{ chain: string; tvl: number }> = [];
    if (currentChainTvls) {
      for (const [chain, tvl] of Object.entries(currentChainTvls)) {
        breakdown.push({ chain, tvl });
      }
      breakdown.sort((a, b) => b.tvl - a.tvl);
    }

    return {
      protocol: data['name'],
      total_tvl: data['tvl'],
      chain_breakdown: breakdown,
      chain_details: chainTvls,
    };
  },
});
