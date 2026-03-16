import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Get TVL breakdown by chain for zkSync Era from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/zksync%20era',
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, unknown> | undefined;
    const chainTvls = data['chainTvls'] as Record<string, unknown> | undefined;

    // Build breakdown array sorted by TVL descending
    const breakdown = Object.entries(currentChainTvls ?? {})
      .map(([chain, tvl]) => ({ chain, tvl: tvl as number }))
      .sort((a, b) => b.tvl - a.tvl);

    return {
      protocol: data['name'],
      total_tvl: data['tvl'],
      chain_breakdown: breakdown,
      chain_tvls_detail: chainTvls,
    };
  },
});
