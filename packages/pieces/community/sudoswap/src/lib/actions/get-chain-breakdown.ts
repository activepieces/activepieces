import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'getChainBreakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch the TVL breakdown by blockchain for the Sudoswap protocol via DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/sudoswap',
    });

    const data = response.body;
    const currentChainTvls = (data['currentChainTvls'] as Record<string, number>) || {};
    const chains = (data['chains'] as string[]) || [];

    const breakdown = chains.map((chain: string) => ({
      chain,
      tvl_usd: currentChainTvls[chain] || 0,
    }));

    breakdown.sort((a, b) => b.tvl_usd - a.tvl_usd);

    return {
      total_chains: chains.length,
      chains: breakdown,
      last_updated: new Date().toISOString(),
    };
  },
});
