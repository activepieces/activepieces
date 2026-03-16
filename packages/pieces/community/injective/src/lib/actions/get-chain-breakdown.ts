import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Fetch TVL breakdown by chain for Injective protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/injective',
    });

    const data = response.body as Record<string, unknown>;
    const chainTvls = data['chainTvls'] as Record<string, unknown> | undefined;

    if (!chainTvls) {
      return { chainBreakdown: {}, totalChains: 0 };
    }

    const breakdown: Record<string, unknown> = {};
    for (const [chain, tvlData] of Object.entries(chainTvls)) {
      const tvlArray = (tvlData as Record<string, unknown>)['tvl'] as Array<{ date: number; totalLiquidityUSD: number }> | undefined;
      if (tvlArray && tvlArray.length > 0) {
        const latest = tvlArray[tvlArray.length - 1];
        breakdown[chain] = {
          currentTvl: latest.totalLiquidityUSD,
          lastUpdated: new Date(latest.date * 1000).toISOString(),
        };
      }
    }

    return {
      chainBreakdown: breakdown,
      totalChains: Object.keys(breakdown).length,
    };
  },
});
