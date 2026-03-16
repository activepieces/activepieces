import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Fetch the TVL breakdown by chain for the Sei Network protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/sei',
    });
    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chainTvls = data['chainTvls'] as Record<string, unknown> | undefined;

    const breakdown = currentChainTvls
      ? Object.entries(currentChainTvls).map(([chain, tvl]) => ({
          chain,
          tvl_usd: tvl,
        }))
      : [];

    breakdown.sort((a, b) => b.tvl_usd - a.tvl_usd);

    return {
      protocol: data['name'],
      total_chains: breakdown.length,
      chain_breakdown: breakdown,
      available_chain_data: chainTvls ? Object.keys(chainTvls) : [],
    };
  },
});
