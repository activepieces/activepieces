import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description:
    'Fetch the TVL breakdown by blockchain for Moonriver protocol via DeFiLlama. No API key required.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/moonriver',
    });
    const data = response.body as Record<string, unknown>;
    const chainTvls = data['chainTvls'] as Record<string, unknown> | undefined;
    const chains: Record<string, number> = {};
    if (chainTvls) {
      for (const [chain, tvlData] of Object.entries(chainTvls)) {
        const tvlObj = tvlData as Record<string, unknown>;
        const tvlArr = tvlObj['tvl'] as
          | Array<{ date: number; totalLiquidityUSD: number }>
          | undefined;
        if (tvlArr && tvlArr.length > 0) {
          chains[chain] = tvlArr[tvlArr.length - 1].totalLiquidityUSD;
        }
      }
    }
    return {
      protocol: data['name'],
      chain_breakdown: chains,
      total_chains: Object.keys(chains).length,
    };
  },
});
