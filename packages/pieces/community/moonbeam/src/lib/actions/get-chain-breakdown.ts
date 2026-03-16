import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get-chain-breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Fetch the TVL breakdown by chain for Moonbeam from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/moonbeam',
    });

    const data = response.body as Record<string, unknown>;
    const chainTvls = data['chainTvls'] as Record<string, { tvl: number }> | undefined;

    const breakdown: Array<{ chain: string; tvl: number }> = [];
    if (chainTvls) {
      for (const [chain, info] of Object.entries(chainTvls)) {
        breakdown.push({ chain, tvl: info.tvl });
      }
      breakdown.sort((a, b) => b.tvl - a.tvl);
    }

    return {
      chains: breakdown,
      total_chains: breakdown.length,
    };
  },
});
