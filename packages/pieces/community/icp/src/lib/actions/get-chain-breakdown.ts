import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Fetch the TVL breakdown by chain for Internet Computer Protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/internet-computer',
    });

    const data = response.body;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> ?? {};
    const chainTvls = data['chainTvls'] as Record<string, unknown> ?? {};

    const breakdown = Object.entries(currentChainTvls).map(([chain, tvl]) => ({
      chain,
      tvl,
    }));

    const totalTvl = breakdown.reduce((sum, item) => sum + (item.tvl ?? 0), 0);

    return {
      protocol: data['name'],
      totalTvl,
      chainBreakdown: breakdown,
      chainCount: breakdown.length,
      chains: Object.keys(chainTvls),
    };
  },
});
