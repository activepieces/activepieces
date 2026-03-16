import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Fetch the TVL breakdown by chain for the TON protocol from DeFiLlama.',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/ton',
    });
    const data = response.body as Record<string, unknown>;
    const chainTvls = data['chainTvls'] as Record<string, { tvl: Array<{ date: number; totalLiquidityUSD: number }> }>;
    const chains = data['chains'] as string[];

    const breakdown: Record<string, number> = {};
    if (chainTvls) {
      for (const chain of Object.keys(chainTvls)) {
        const tvlArr = chainTvls[chain]?.tvl;
        if (tvlArr && tvlArr.length > 0) {
          breakdown[chain] = tvlArr[tvlArr.length - 1].totalLiquidityUSD;
        }
      }
    }

    return {
      protocol: data['name'],
      chains,
      chain_tvl_breakdown: breakdown,
      total_chains: chains ? chains.length : 0,
    };
  },
});
