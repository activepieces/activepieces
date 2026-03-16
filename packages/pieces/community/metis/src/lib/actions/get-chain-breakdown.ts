import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description:
    'Fetch the TVL breakdown by chain for the Metis protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/metis',
    });

    const data = response.body as Record<string, unknown>;
    const chainTvls = data['chainTvls'] as Record<string, unknown> | undefined;
    const currentChainTvls = data['currentChainTvls'] as Record<string, number> | undefined;

    const breakdown: Record<string, { current_tvl: number }> = {};
    if (currentChainTvls) {
      for (const [chain, tvl] of Object.entries(currentChainTvls)) {
        breakdown[chain] = { current_tvl: tvl };
      }
    }

    const chainHistorySummary: Record<string, { data_points: number }> = {};
    if (chainTvls) {
      for (const [chain, chainData] of Object.entries(chainTvls)) {
        const tvlArray = (chainData as Record<string, unknown>)?.['tvl'] as unknown[] | undefined;
        chainHistorySummary[chain] = {
          data_points: tvlArray?.length ?? 0,
        };
      }
    }

    return {
      protocol: data['name'],
      chains: data['chains'],
      current_chain_tvls: currentChainTvls,
      chain_history_summary: chainHistorySummary,
    };
  },
});
