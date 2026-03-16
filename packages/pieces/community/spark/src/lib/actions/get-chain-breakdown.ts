import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Get TVL breakdown by blockchain for Spark Protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/spark',
      headers: {
        Accept: 'application/json',
      },
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chains = data['chains'] as string[] | undefined;

    const breakdown = Object.entries(currentChainTvls ?? {}).map(([chain, tvl]) => ({
      chain,
      tvl,
    }));

    breakdown.sort((a, b) => b.tvl - a.tvl);

    return {
      chains: chains ?? [],
      breakdown,
      total_chains: chains?.length ?? 0,
    };
  },
});
