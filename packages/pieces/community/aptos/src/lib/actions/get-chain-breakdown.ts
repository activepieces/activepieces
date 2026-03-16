import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Retrieve TVL breakdown by chain for the Aptos protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/aptos',
    });

    const data = response.body as Record<string, unknown>;
    const chainTvls = data['chainTvls'] as
      | Record<string, { tvl: { date: number; totalLiquidityUSD: number }[] }>
      | undefined;

    const breakdown: Record<string, number> = {};

    if (chainTvls) {
      for (const [chain, chainData] of Object.entries(chainTvls)) {
        const tvlArray = chainData?.tvl;
        if (Array.isArray(tvlArray) && tvlArray.length > 0) {
          breakdown[chain] = tvlArray[tvlArray.length - 1].totalLiquidityUSD;
        }
      }
    }

    return {
      chains: data['chains'],
      tvlBreakdownByChain: breakdown,
      totalChains: Object.keys(breakdown).length,
    };
  },
});
