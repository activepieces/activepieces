import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getChainBreakdown = createAction({
  name: 'get_chain_breakdown',
  displayName: 'Get Chain Breakdown',
  description: 'Get TVL breakdown by chain for Aurora protocol from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/aurora',
    });
    const data = response.body as Record<string, unknown>;
    const chainTvls = data['chainTvls'] as Record<string, unknown> | undefined;
    const currentChainTvls: Record<string, unknown> = {};
    if (chainTvls) {
      for (const [chain, tvlData] of Object.entries(chainTvls)) {
        const tvlArray = (tvlData as Record<string, unknown>)['tvl'] as Array<Record<string, unknown>> | undefined;
        if (tvlArray && tvlArray.length > 0) {
          const latest = tvlArray[tvlArray.length - 1];
          currentChainTvls[chain] = {
            tvl: latest['totalLiquidityUSD'],
            date: new Date((latest['date'] as number) * 1000).toISOString(),
          };
        }
      }
    }
    return {
      protocol: data['name'],
      slug: data['slug'],
      chain_breakdown: currentChainTvls,
    };
  },
});
