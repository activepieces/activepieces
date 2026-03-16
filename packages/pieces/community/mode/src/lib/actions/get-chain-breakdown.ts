import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdownAction = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Fetch the TVL breakdown by blockchain for Mode Network from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/mode',
    });

    const data = response.body as Record<string, unknown>;
    const chainTvls = data['chainTvls'] as Record<string, Record<string, unknown>> | undefined;

    if (!chainTvls) {
      return { chains: [], total_chains: 0 };
    }

    const chains = Object.entries(chainTvls)
      .map(([chain, info]) => {
        const tvlArr = info['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;
        const latestTvl = tvlArr && tvlArr.length > 0 ? tvlArr[tvlArr.length - 1]?.totalLiquidityUSD : 0;
        return {
          chain,
          tvl_usd: latestTvl ?? 0,
        };
      })
      .filter(c => c.tvl_usd > 0)
      .sort((a, b) => b.tvl_usd - a.tvl_usd);

    return {
      chains,
      total_chains: chains.length,
    };
  },
});
