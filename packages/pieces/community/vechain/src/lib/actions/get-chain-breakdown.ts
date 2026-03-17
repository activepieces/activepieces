import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Retrieve TVL breakdown by protocol on the VeChain chain from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/vechain',
    });

    const data = response.body as Record<string, unknown>;
    const chainTvls = data['chainTvls'] as Record<string, unknown> | undefined;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;
    const tokens = data['tokens'] as unknown[];
    const tokensInUsd = data['tokensInUsd'] as unknown[];

    const breakdown: Record<string, unknown> = {};
    if (currentChainTvls) {
      for (const [chain, tvl] of Object.entries(currentChainTvls)) {
        breakdown[chain] = {
          current_tvl_usd: tvl,
          history: chainTvls?.[chain],
        };
      }
    }

    return {
      name: data['name'],
      total_tvl_usd: data['tvl'],
      chain_breakdown: breakdown,
      current_chain_tvls: currentChainTvls,
      tokens_summary: Array.isArray(tokens) ? tokens.slice(-1)[0] : null,
      tokens_in_usd_summary: Array.isArray(tokensInUsd) ? tokensInUsd.slice(-1)[0] : null,
    };
  },
});
