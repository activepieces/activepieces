import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Fetch the TVL breakdown by blockchain chain for Tensor from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/tensor',
    });
    const data = response.body;
    const chainTvls = (data['chainTvls'] as Record<string, unknown>) ?? {};
    const breakdown: Record<string, unknown> = {};
    for (const [chain, tvlData] of Object.entries(chainTvls)) {
      const tvlObj = tvlData as Record<string, unknown>;
      const tvlArr = tvlObj['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;
      if (tvlArr && tvlArr.length > 0) {
        const latest = tvlArr[tvlArr.length - 1];
        breakdown[chain] = {
          current_tvl_usd: latest.totalLiquidityUSD,
          last_updated: new Date(latest.date * 1000).toISOString(),
        };
      }
    }
    return {
      protocol: data['name'],
      chains: data['chains'],
      chain_breakdown: breakdown,
    };
  },
});
