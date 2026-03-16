import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getChainBreakdownAction = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Get the TVL breakdown by chain for the Kava protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/kava',
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chains = data['chains'] as string[] | undefined;

    // Build a sorted array of chains with their TVL values
    const chainBreakdown = Object.entries(currentChainTvls ?? {})
      .map(([chain, tvl]) => ({ chain, tvl }))
      .sort((a, b) => b.tvl - a.tvl);

    const totalTvl = chainBreakdown.reduce((sum, c) => sum + c.tvl, 0);

    return {
      chains: chains ?? [],
      chain_breakdown: chainBreakdown,
      total_tvl: totalTvl,
      chain_count: chainBreakdown.length,
    };
  },
});
