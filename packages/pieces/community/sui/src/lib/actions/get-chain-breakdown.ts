import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description:
    'Fetch the TVL breakdown by chain for the Sui Network protocol via DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/sui',
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chainTvls = data['chainTvls'] as Record<string, unknown> | undefined;

    const breakdown: Array<{ chain: string; tvl: number }> = [];
    if (currentChainTvls) {
      for (const [chain, tvl] of Object.entries(currentChainTvls)) {
        breakdown.push({ chain, tvl });
      }
    }

    return {
      protocol: data['name'],
      totalTvl: data['tvl'],
      chainBreakdown: breakdown,
      chainTvls: chainTvls,
    };
  },
});
