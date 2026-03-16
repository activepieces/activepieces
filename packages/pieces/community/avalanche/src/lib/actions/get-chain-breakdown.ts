import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getChainBreakdownAction = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description:
    'Fetch the TVL breakdown by individual blockchain chains for the Avalanche ecosystem from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/avalanche',
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = (data['currentChainTvls'] ?? {}) as Record<string, number>;

    const chains = Object.entries(currentChainTvls)
      .map(([chain, tvl]) => ({ chain, tvlUsd: tvl }))
      .sort((a, b) => b.tvlUsd - a.tvlUsd);

    return {
      totalTvlUsd: data['tvl'],
      chainCount: chains.length,
      chains,
    };
  },
});
