import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get TVL Chain Breakdown',
  description: 'Get Harvest Finance TVL broken down by blockchain (Ethereum, BSC, Polygon, etc.) from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/harvest-finance',
    });
    const data = response.body as Record<string, unknown>;
    const chainTvls = data['chainTvls'] as Record<string, unknown> | undefined;

    if (!chainTvls) {
      return { chains: [], total_tvl: data['tvl'] };
    }

    const chains = Object.entries(chainTvls).map(([chain, tvlData]) => {
      const tvlObj = tvlData as Record<string, unknown>;
      const tvlArr = tvlObj['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;
      const latestTvl = tvlArr && tvlArr.length > 0 ? tvlArr[tvlArr.length - 1]?.['totalLiquidityUSD'] : 0;
      return {
        chain,
        tvl_usd: latestTvl ?? 0,
      };
    }).sort((a, b) => b.tvl_usd - a.tvl_usd);

    return {
      chains,
      chain_count: chains.length,
      total_tvl: data['tvl'],
    };
  },
});
