import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get TVL Chain Breakdown',
  description: 'Fetch the TVL breakdown by chain (Manta Pacific, Manta Atlantic, etc.) from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/manta',
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chains = data['chains'] as string[] | undefined;

    const breakdown = currentChainTvls
      ? Object.entries(currentChainTvls).map(([chain, tvl]) => ({
          chain,
          tvl_usd: tvl,
        }))
      : [];

    const totalTvl = breakdown.reduce((sum, item) => sum + (item.tvl_usd ?? 0), 0);

    return {
      chains: chains ?? [],
      chain_breakdown: breakdown,
      total_tvl_usd: totalTvl,
      chain_count: breakdown.length,
    };
  },
});
