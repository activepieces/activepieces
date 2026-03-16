import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain TVL Breakdown',
  description: 'Fetch TVL breakdown by chain for Cronos from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/cronos',
    });
    const data = response.body as Record<string, unknown>;
    const chainTvls = data['chainTvls'] as Record<string, unknown> | undefined;
    if (!chainTvls) {
      return { chainTvls: {}, totalTvl: data['tvl'] };
    }
    const breakdown: Record<string, unknown> = {};
    for (const [chain, tvlData] of Object.entries(chainTvls)) {
      const tvlObj = tvlData as Record<string, unknown>;
      const tvlArr = tvlObj['tvl'] as Array<Record<string, unknown>> | undefined;
      if (tvlArr && tvlArr.length > 0) {
        breakdown[chain] = tvlArr[tvlArr.length - 1]['totalLiquidityUSD'];
      }
    }
    return {
      chainTvlBreakdown: breakdown,
      totalTvl: data['tvl'],
    };
  },
});
