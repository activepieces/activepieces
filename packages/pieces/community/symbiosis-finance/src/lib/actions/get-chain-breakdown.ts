import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Get Symbiosis Finance TVL breakdown by chain from DeFiLlama',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/symbiosis-finance',
    });
    const data = response.body as Record<string, unknown>;
    const chainTvls = data['chainTvls'] as Record<string, unknown>;
    const breakdown = Object.entries(chainTvls || {}).map(([chain, tvlData]) => {
      const tvlObj = tvlData as Record<string, unknown>;
      const tvlArr = tvlObj['tvl'] as Array<{date: number; totalLiquidityUSD: number}>;
      const latestTvl = tvlArr && tvlArr.length > 0 ? tvlArr[tvlArr.length - 1].totalLiquidityUSD : 0;
      return { chain, tvl: latestTvl };
    });
    breakdown.sort((a, b) => b.tvl - a.tvl);
    return {
      protocol: 'Symbiosis Finance',
      chains: breakdown,
      total_chains: breakdown.length,
    };
  },
});
