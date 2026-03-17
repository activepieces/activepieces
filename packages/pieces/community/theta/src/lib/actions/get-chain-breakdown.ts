import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description:
    'Fetch the TVL breakdown by chain for Theta Network from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/theta',
    });

    const data = response.body;
    const chainTvls = (data['currentChainTvls'] ?? {}) as Record<string, number>;
    const breakdown = Object.entries(chainTvls).map(([chain, tvl]) => ({
      chain,
      tvl_usd: tvl,
    }));

    breakdown.sort((a, b) => b.tvl_usd - a.tvl_usd);

    return {
      protocol: data['name'],
      total_tvl: data['tvl'],
      chain_count: breakdown.length,
      chains: breakdown,
    };
  },
});
