import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Get the TVL breakdown by individual blockchain for the Hyperlane protocol.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/hyperlane',
    });

    const data = response.body;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chains = data['chains'] as string[] | undefined;

    const chainBreakdown: Array<{ chain: string; tvl: number }> = [];
    if (currentChainTvls) {
      for (const [chain, tvl] of Object.entries(currentChainTvls)) {
        chainBreakdown.push({ chain, tvl });
      }
      chainBreakdown.sort((a, b) => b.tvl - a.tvl);
    }

    const totalTvl = chainBreakdown.reduce((sum, item) => sum + item.tvl, 0);

    return {
      total_tvl: totalTvl,
      chain_count: chainBreakdown.length,
      supported_chains: chains,
      breakdown: chainBreakdown,
    };
  },
});
