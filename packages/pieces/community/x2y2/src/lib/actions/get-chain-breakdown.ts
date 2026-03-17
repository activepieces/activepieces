import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdownAction = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Fetch the TVL breakdown by blockchain for X2Y2 from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/x2y2',
    });

    const data = response.body as Record<string, unknown>;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const chains = data['chains'] as string[] | undefined;

    const breakdown = Object.entries(currentChainTvls ?? {}).map(([chain, tvl]) => ({
      chain,
      tvlUsd: tvl,
    }));

    breakdown.sort((a, b) => b.tvlUsd - a.tvlUsd);

    return {
      chains: chains ?? [],
      breakdown,
      totalChains: breakdown.length,
    };
  },
});
